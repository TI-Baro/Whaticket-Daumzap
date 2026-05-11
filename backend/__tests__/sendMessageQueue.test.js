'use strict';

function normalizeRecipientJid({ number, isGroup }) {
  const raw = ('' + (number ?? '')).trim();
  if (!raw) throw new Error('ERR_CONTACT_WITHOUT_VALID_IDENTIFIER');

  if (raw.includes('@')) {
    if (
      raw.endsWith('@g.us') ||
      raw.endsWith('@s.whatsapp.net') ||
      raw.endsWith('@lid')
    ) {
      return raw;
    }
    throw new Error('ERR_CONTACT_WITHOUT_VALID_IDENTIFIER');
  }

  if (raw.startsWith('temp_')) throw new Error('ERR_CONTACT_WITHOUT_VALID_IDENTIFIER');
  if (raw.startsWith('lid_')) return raw.substring(4) + '@lid';

  const digits = raw.replace(/\D/g, '');
  if (!digits) throw new Error('ERR_CONTACT_WITHOUT_VALID_IDENTIFIER');

  if (isGroup || (digits.startsWith('120363') && digits.length >= 16)) return digits + '@g.us';
  return digits + '@' + (digits.length > 13 ? 'lid' : 's.whatsapp.net');
}

async function simulateSendMessageJob({
  wbot,
  data,
  getMessageOptions = async () => null,
  handleMessage = async () => null,
}) {
  if (!wbot || !wbot.user) throw new Error('ERR_WAPP_NOT_INITIALIZED');

  const jid = normalizeRecipientJid({ number: data.number, isGroup: !!data.isGroup });
  const body = '' + (data.body ?? '');
  const mediaPath = data.mediaPath;

  if (!mediaPath && body.trim().length === 0) throw new Error('ERR_SYNTAX');
  if (!mediaPath && body.length > 4096) throw new Error('ERR_MESSAGE_TOO_LONG');
  if (mediaPath && body && body.length > 1024) throw new Error('ERR_MESSAGE_TOO_LONG');

  try {
    let sent;
    if (mediaPath) {
      const opts = await getMessageOptions('file', mediaPath);
      if (opts) sent = await wbot.sendMessage(jid, { caption: body, ...opts });
    } else {
      sent = await wbot.sendMessage(jid, { text: body });
    }

    const saveOnTicket = data.saveOnTicket ?? true;
    if (sent && saveOnTicket) await handleMessage(sent);
    return sent;
  } catch (err) {
    const e = err instanceof Error ? err : new Error(err && err.message ? err.message : String(err));
    throw e;
  }
}

describe('Queue SendMessage — group JID + validações + anexos + falha de rede', () => {
  function makeWbot({ connected = true, sendReject = null } = {}) {
    return {
      user: connected ? { id: '55@s.whatsapp.net' } : undefined,
      sendMessage: jest.fn().mockImplementation(async () => {
        if (sendReject) throw sendReject;
        return { key: { id: 'm1' } };
      }),
    };
  }

  test('normaliza ID de grupo 120363... para @g.us (sem @ no input)', async () => {
    const wbot = makeWbot();
    await simulateSendMessageJob({ wbot, data: { number: '120363123456789012', body: 'oi' } });

    expect(wbot.sendMessage).toHaveBeenCalledWith(
      '120363123456789012@g.us',
      expect.objectContaining({ text: 'oi' })
    );
  });

  test('usa @g.us quando isGroup=true, mesmo sem padrão 120363', async () => {
    const wbot = makeWbot();
    await simulateSendMessageJob({
      wbot,
      data: { number: '5511999990000', body: 'msg', isGroup: true },
    });

    expect(wbot.sendMessage).toHaveBeenCalledWith(
      '5511999990000@g.us',
      expect.objectContaining({ text: 'msg' })
    );
  });

  test('mantém comportamento para LID: >13 dígitos vira @lid quando não é grupo', async () => {
    const wbot = makeWbot();
    await simulateSendMessageJob({ wbot, data: { number: '1234567890123456', body: 'x' } });

    expect(wbot.sendMessage).toHaveBeenCalledWith(
      '1234567890123456@lid',
      expect.objectContaining({ text: 'x' })
    );
  });

  test('rejeita temp_ como identificador inválido', async () => {
    const wbot = makeWbot();
    await expect(
      simulateSendMessageJob({ wbot, data: { number: 'temp_1715000000000', body: 'x' } })
    ).rejects.toThrow('ERR_CONTACT_WITHOUT_VALID_IDENTIFIER');
  });

  test('rejeita JID com sufixo desconhecido (@foo)', async () => {
    const wbot = makeWbot();
    await expect(
      simulateSendMessageJob({ wbot, data: { number: '123@foo', body: 'x' } })
    ).rejects.toThrow('ERR_CONTACT_WITHOUT_VALID_IDENTIFIER');
  });

  test('falha quando wbot não está inicializado (sem user)', async () => {
    const wbot = makeWbot({ connected: false });
    await expect(
      simulateSendMessageJob({ wbot, data: { number: '5511999990000', body: 'x' } })
    ).rejects.toThrow('ERR_WAPP_NOT_INITIALIZED');
  });

  test('envio com anexo usa getMessageOptions e manda caption', async () => {
    const wbot = makeWbot();
    const getMessageOptions = jest.fn().mockResolvedValue({ image: { stream: 'fake' } });
    const handleMessage = jest.fn();

    await simulateSendMessageJob({
      wbot,
      data: { number: '120363123456789012', body: 'legenda', mediaPath: '/tmp/file.png', isGroup: true },
      getMessageOptions,
      handleMessage,
    });

    expect(getMessageOptions).toHaveBeenCalled();
    expect(wbot.sendMessage).toHaveBeenCalledWith(
      '120363123456789012@g.us',
      expect.objectContaining({ caption: 'legenda' })
    );
    expect(handleMessage).toHaveBeenCalled();
  });

  test('limite de texto (4096) é aplicado em mensagem sem anexo', async () => {
    const wbot = makeWbot();
    await expect(
      simulateSendMessageJob({ wbot, data: { number: '5511999990000', body: 'a'.repeat(4097) } })
    ).rejects.toThrow('ERR_MESSAGE_TOO_LONG');
  });

  test('limite de caption (1024) é aplicado em mensagem com anexo', async () => {
    const wbot = makeWbot();
    await expect(
      simulateSendMessageJob({
        wbot,
        data: { number: '120363123456789012', body: 'a'.repeat(1025), mediaPath: '/tmp/file.pdf', isGroup: true },
      })
    ).rejects.toThrow('ERR_MESSAGE_TOO_LONG');
  });

  test('falha de rede no sendMessage é propagada com mensagem legível', async () => {
    const wbot = makeWbot({ sendReject: new Error('Connection Closed') });
    await expect(
      simulateSendMessageJob({
        wbot,
        data: { number: '120363123456789012', body: 'oi', isGroup: true },
      })
    ).rejects.toThrow('Connection Closed');
  });
});
