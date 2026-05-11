'use strict';

/**
 * Unit + integration tests for the SendWhatsAppMessage send flow.
 *
 * These tests exercise the logic that was changed in this session:
 *   1. buildRecipientJid  — correct JID for groups / individuals
 *   2. Pre-flight wbot connection check  (wbot.user must exist)
 *   3. AppError pass-through in the catch block (not collapsed to ERR_SENDING_WAPP_MSG)
 *   4. Generic errors still become ERR_SENDING_WAPP_MSG
 *
 * We recreate the relevant logic in plain JS (the dist files are obfuscated) and
 * test the *behaviour*, not the obfuscation tokens.
 */

// ──────────────────────────────────────────────────────────────────────────────
// Helpers that mirror the dist code
// ──────────────────────────────────────────────────────────────────────────────

class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'AppError';
    this.message = message;
    this.statusCode = statusCode;
  }
}

function buildRecipientJid(ticket) {
  const contact = ticket.contact;
  if (ticket.isGroup) {
    if (contact.remoteJid && contact.remoteJid.endsWith('@g.us')) return contact.remoteJid;
    const gnum = contact.number;
    if (!gnum || gnum.startsWith('temp_') || gnum.startsWith('lid_'))
      throw new AppError('ERR_CONTACT_WITHOUT_VALID_IDENTIFIER');
    return gnum + '@g.us';
  }
  if (contact.remoteJid) return contact.remoteJid;
  if (contact.lid) return contact.lid + '@lid';
  const number = contact.number;
  if (number.startsWith('lid_')) return number.substring(4) + '@lid';
  if (number.startsWith('temp_')) throw new AppError('ERR_CONTACT_WITHOUT_VALID_IDENTIFIER');
  if (number.length > 15) return number + '@lid';
  return number + '@s.whatsapp.net';
}

/** Mirrors the pre-flight check added after GetTicketWbot */
function checkWbotConnection(wbot) {
  if (!wbot || !wbot.user) throw new AppError('ERR_WAPP_NOT_INITIALIZED');
}

/**
 * Mirrors the catch block behaviour (re-throw AppError, wrap others).
 */
function handleSendError(err) {
  if (err instanceof AppError) throw err;
  throw new AppError('ERR_SENDING_WAPP_MSG');
}

/**
 * Simulates the full send path used in SendWhatsAppMessage / SendWhatsAppMedia:
 *   getTicketWbot → buildRecipientJid → checkConnection → sendMessage
 */
async function simulateSend({ ticket, wbot, sendMessageFn }) {
  // These steps are OUTSIDE the try block in the dist code
  const jid = buildRecipientJid(ticket);
  checkWbotConnection(wbot);

  try {
    const result = await sendMessageFn(jid);
    return result;
  } catch (err) {
    // mirrors the new catch block: re-throw AppError, wrap the rest
    handleSendError(err);
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// 1. Connection state checks
// ──────────────────────────────────────────────────────────────────────────────

describe('pre-flight connection check', () => {
  test('throws ERR_WAPP_NOT_INITIALIZED when wbot is null', () => {
    expect(() => checkWbotConnection(null)).toThrow('ERR_WAPP_NOT_INITIALIZED');
  });

  test('throws ERR_WAPP_NOT_INITIALIZED when wbot.user is undefined (not authenticated)', () => {
    expect(() => checkWbotConnection({ sendMessage: jest.fn() })).toThrow(
      'ERR_WAPP_NOT_INITIALIZED'
    );
  });

  test('does NOT throw when wbot.user is set', () => {
    expect(() => checkWbotConnection({ user: { id: '5511@s.whatsapp.net' } })).not.toThrow();
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 2. AppError pass-through in catch block
// ──────────────────────────────────────────────────────────────────────────────

describe('catch block — AppError pass-through', () => {
  test('re-throws AppError unchanged', () => {
    const original = new AppError('ERR_CONTACT_WITHOUT_VALID_IDENTIFIER');
    expect(() => handleSendError(original)).toThrow('ERR_CONTACT_WITHOUT_VALID_IDENTIFIER');
  });

  test('re-thrown error is still an AppError instance', () => {
    const original = new AppError('ERR_WAPP_NOT_INITIALIZED');
    try {
      handleSendError(original);
    } catch (e) {
      expect(e).toBeInstanceOf(AppError);
      expect(e.message).toBe('ERR_WAPP_NOT_INITIALIZED');
    }
  });

  test('wraps plain Error as ERR_SENDING_WAPP_MSG', () => {
    expect(() => handleSendError(new Error('socket closed'))).toThrow('ERR_SENDING_WAPP_MSG');
  });

  test('wraps TypeError as ERR_SENDING_WAPP_MSG', () => {
    expect(() => handleSendError(new TypeError('Cannot read property'))).toThrow(
      'ERR_SENDING_WAPP_MSG'
    );
  });

  test('OLD BUG: AppError used to be silently replaced by ERR_SENDING_WAPP_MSG', () => {
    // Demonstrates what the old code did
    function oldHandleSendError(_err) {
      throw new AppError('ERR_SENDING_WAPP_MSG'); // always, regardless of error type
    }

    const specific = new AppError('ERR_WAPP_NOT_INITIALIZED');
    try {
      oldHandleSendError(specific);
    } catch (e) {
      expect(e.message).toBe('ERR_SENDING_WAPP_MSG'); // lost original error
      expect(e.message).not.toBe('ERR_WAPP_NOT_INITIALIZED');
    }

    // Fixed behaviour:
    try {
      handleSendError(specific);
    } catch (e) {
      expect(e.message).toBe('ERR_WAPP_NOT_INITIALIZED'); // preserved
    }
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 3. Full send simulation — happy paths
// ──────────────────────────────────────────────────────────────────────────────

describe('simulateSend — successful sends', () => {
  const connectedWbot = { user: { id: '5511@s.whatsapp.net' }, sendMessage: jest.fn() };

  test('sends to group via remoteJid', async () => {
    const ticket = {
      isGroup: true,
      contact: { remoteJid: '120363111@g.us', number: 'temp_123' },
    };
    const mockSend = jest.fn().mockResolvedValue({ key: { id: 'abc' } });
    const result = await simulateSend({ ticket, wbot: connectedWbot, sendMessageFn: mockSend });
    expect(mockSend).toHaveBeenCalledWith('120363111@g.us');
    expect(result).toMatchObject({ key: { id: 'abc' } });
  });

  test('sends to individual via remoteJid', async () => {
    const ticket = {
      isGroup: false,
      contact: { remoteJid: '5511988887777@s.whatsapp.net', number: '5511988887777' },
    };
    const mockSend = jest.fn().mockResolvedValue({ key: { id: 'xyz' } });
    await simulateSend({ ticket, wbot: connectedWbot, sendMessageFn: mockSend });
    expect(mockSend).toHaveBeenCalledWith('5511988887777@s.whatsapp.net');
  });

  test('sends to LID contact', async () => {
    const ticket = {
      isGroup: false,
      contact: { remoteJid: null, number: '5511988887777', lid: '12345678901234' },
    };
    const mockSend = jest.fn().mockResolvedValue({ key: { id: 'lid1' } });
    await simulateSend({ ticket, wbot: connectedWbot, sendMessageFn: mockSend });
    expect(mockSend).toHaveBeenCalledWith('12345678901234@lid');
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 4. Full send simulation — failure paths
// ──────────────────────────────────────────────────────────────────────────────

describe('simulateSend — failure scenarios', () => {
  test('throws ERR_WAPP_NOT_INITIALIZED when wbot has no user (not connected)', async () => {
    const ticket = {
      isGroup: false,
      contact: { remoteJid: '5511@s.whatsapp.net', number: '5511' },
    };
    const disconnectedWbot = {}; // no .user
    await expect(
      simulateSend({ ticket, wbot: disconnectedWbot, sendMessageFn: jest.fn() })
    ).rejects.toThrow('ERR_WAPP_NOT_INITIALIZED');
  });

  test('throws ERR_CONTACT_WITHOUT_VALID_IDENTIFIER for group with temp_ number and no remoteJid', async () => {
    const ticket = {
      isGroup: true,
      contact: { remoteJid: null, number: 'temp_1715000000000' },
    };
    const wbot = { user: { id: '55@s.whatsapp.net' } };
    await expect(
      simulateSend({ ticket, wbot, sendMessageFn: jest.fn() })
    ).rejects.toThrow('ERR_CONTACT_WITHOUT_VALID_IDENTIFIER');
  });

  test('ERR_CONTACT_WITHOUT_VALID_IDENTIFIER is preserved (not wrapped) through catch block', async () => {
    const ticket = {
      isGroup: true,
      contact: { remoteJid: null, number: 'lid_someid' },
    };
    const wbot = { user: { id: '55@s.whatsapp.net' } };
    let caught;
    try {
      await simulateSend({ ticket, wbot, sendMessageFn: jest.fn() });
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(AppError);
    expect(caught.message).toBe('ERR_CONTACT_WITHOUT_VALID_IDENTIFIER');
    // NOT ERR_SENDING_WAPP_MSG
    expect(caught.message).not.toBe('ERR_SENDING_WAPP_MSG');
  });

  test('Baileys socket error becomes ERR_SENDING_WAPP_MSG', async () => {
    const ticket = {
      isGroup: false,
      contact: { remoteJid: '5511@s.whatsapp.net', number: '5511' },
    };
    const wbot = { user: { id: '55@s.whatsapp.net' } };
    const baileysError = new Error('Connection Closed');
    await expect(
      simulateSend({ ticket, wbot, sendMessageFn: jest.fn().mockRejectedValue(baileysError) })
    ).rejects.toThrow('ERR_SENDING_WAPP_MSG');
  });

  test('network timeout becomes ERR_SENDING_WAPP_MSG', async () => {
    const ticket = {
      isGroup: false,
      contact: { remoteJid: '5511@s.whatsapp.net', number: '5511' },
    };
    const wbot = { user: { id: '55@s.whatsapp.net' } };
    const timeoutError = new Error('Request timed out');
    await expect(
      simulateSend({ ticket, wbot, sendMessageFn: jest.fn().mockRejectedValue(timeoutError) })
    ).rejects.toThrow('ERR_SENDING_WAPP_MSG');
  });

  test('null wbot (GetTicketWbot returns null) throws ERR_WAPP_NOT_INITIALIZED', async () => {
    const ticket = {
      isGroup: false,
      contact: { remoteJid: '5511@s.whatsapp.net', number: '5511' },
    };
    await expect(
      simulateSend({ ticket, wbot: null, sendMessageFn: jest.fn() })
    ).rejects.toThrow('ERR_WAPP_NOT_INITIALIZED');
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 5. SendWhatsAppMedia — group JID fallback validation (media send)
// ──────────────────────────────────────────────────────────────────────────────

/** Mirrors SendWhatsAppMedia JID resolution logic (fixed version) */
function resolveMediaJid(ticket) {
  const contact = ticket.contact;
  if (ticket.isGroup) {
    if (contact.remoteJid && contact.remoteJid.endsWith('@g.us')) return contact.remoteJid;
    const gmn = contact.number;
    if (!gmn || gmn.startsWith('temp_') || gmn.startsWith('lid_'))
      throw new AppError('ERR_CONTACT_WITHOUT_VALID_IDENTIFIER');
    return gmn + '@g.us';
  }
  if (contact.remoteJid) return contact.remoteJid;
  if (contact.lid) return contact.lid + '@lid';
  if (contact.number) {
    const n = contact.number;
    if (n.startsWith('lid_')) return n.substring(4) + '@lid';
    if (n.startsWith('temp_')) throw new AppError('ERR_CONTACT_WITHOUT_VALID_IDENTIFIER');
    if (n.length > 15) return n + '@lid';
    return n + '@s.whatsapp.net';
  }
  throw new AppError('ERR_SENDING_WAPP_MSG: Contact has no valid number or remoteJid');
}

describe('SendWhatsAppMedia — JID resolution', () => {
  test('group: uses remoteJid when valid', () => {
    expect(
      resolveMediaJid({
        isGroup: true,
        contact: { remoteJid: '120363123@g.us', number: 'temp_abc' },
      })
    ).toBe('120363123@g.us');
  });

  test('group: throws on temp_ number without remoteJid', () => {
    expect(() =>
      resolveMediaJid({ isGroup: true, contact: { remoteJid: null, number: 'temp_abc' } })
    ).toThrow('ERR_CONTACT_WITHOUT_VALID_IDENTIFIER');
  });

  test('group: throws on lid_ number without remoteJid', () => {
    expect(() =>
      resolveMediaJid({ isGroup: true, contact: { remoteJid: null, number: 'lid_abc' } })
    ).toThrow('ERR_CONTACT_WITHOUT_VALID_IDENTIFIER');
  });

  test('group: valid numeric number → appends @g.us', () => {
    expect(
      resolveMediaJid({ isGroup: true, contact: { remoteJid: null, number: '5511999990000' } })
    ).toBe('5511999990000@g.us');
  });

  test('individual: uses remoteJid', () => {
    expect(
      resolveMediaJid({
        isGroup: false,
        contact: { remoteJid: '5511@s.whatsapp.net', number: '5511' },
      })
    ).toBe('5511@s.whatsapp.net');
  });
});
