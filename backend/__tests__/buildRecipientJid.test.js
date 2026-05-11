'use strict';

/**
 * Unit tests for buildRecipientJid logic
 *
 * These tests verify the fix applied to SendWhatsAppMessage.js and SendWhatsAppMedia.js
 * that ensures group messages use contact.remoteJid instead of contact.number + '@g.us'
 * (group contacts are stored with number = 'temp_xxx' which is an invalid JID).
 *
 * The function under test is extracted here as plain JS since the dist files are obfuscated.
 */

class AppError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Mirrors the FIXED buildRecipientJid from SendWhatsAppMessage.js
 */
function buildRecipientJid(ticket) {
  const contact = ticket.contact;

  if (ticket.isGroup) {
    // Fixed: use remoteJid when it is already a valid group JID
    if (contact.remoteJid && contact.remoteJid.endsWith('@g.us')) {
      return contact.remoteJid;
    }
    const gnum = contact.number;
    if (!gnum || gnum.startsWith('temp_') || gnum.startsWith('lid_')) {
      throw new AppError('ERR_CONTACT_WITHOUT_VALID_IDENTIFIER');
    }
    return gnum + '@g.us';
  }

  if (contact.remoteJid) return contact.remoteJid;

  if (contact.lid) return contact.lid + '@lid';

  const number = contact.number;
  if (number.startsWith('lid_')) {
    const raw = number.substring(4);
    return raw + '@lid';
  }
  if (number.startsWith('temp_')) {
    throw new AppError('ERR_CONTACT_WITHOUT_VALID_IDENTIFIER');
  }
  if (number.length > 15) return number + '@lid';
  return number + '@s.whatsapp.net';
}

// ─── Group message tests ───────────────────────────────────────────────────────

describe('buildRecipientJid — group tickets', () => {
  test('returns contact.remoteJid when it is a valid @g.us JID', () => {
    const ticket = {
      isGroup: true,
      contact: {
        remoteJid: '120363123456789012@g.us',
        number: 'temp_1715000000000',
      },
    };
    expect(buildRecipientJid(ticket)).toBe('120363123456789012@g.us');
  });

  test('returns contact.remoteJid even when number is lid_xxx', () => {
    const ticket = {
      isGroup: true,
      contact: {
        remoteJid: '120363999888777666@g.us',
        number: 'lid_abc123',
      },
    };
    expect(buildRecipientJid(ticket)).toBe('120363999888777666@g.us');
  });

  test('falls back to number + @g.us when remoteJid is absent and number is valid', () => {
    const ticket = {
      isGroup: true,
      contact: {
        remoteJid: null,
        number: '5511999990000',
      },
    };
    expect(buildRecipientJid(ticket)).toBe('5511999990000@g.us');
  });

  test('throws ERR_CONTACT_WITHOUT_VALID_IDENTIFIER when remoteJid absent and number is temp_', () => {
    const ticket = {
      isGroup: true,
      contact: {
        remoteJid: null,
        number: 'temp_1715000000000',
      },
    };
    expect(() => buildRecipientJid(ticket)).toThrow('ERR_CONTACT_WITHOUT_VALID_IDENTIFIER');
  });

  test('throws ERR_CONTACT_WITHOUT_VALID_IDENTIFIER when remoteJid absent and number is lid_', () => {
    const ticket = {
      isGroup: true,
      contact: {
        remoteJid: null,
        number: 'lid_somelidvalue',
      },
    };
    expect(() => buildRecipientJid(ticket)).toThrow('ERR_CONTACT_WITHOUT_VALID_IDENTIFIER');
  });

  test('throws ERR_CONTACT_WITHOUT_VALID_IDENTIFIER when remoteJid absent and number is empty', () => {
    const ticket = {
      isGroup: true,
      contact: {
        remoteJid: null,
        number: '',
      },
    };
    expect(() => buildRecipientJid(ticket)).toThrow('ERR_CONTACT_WITHOUT_VALID_IDENTIFIER');
  });

  test('does NOT use a non-@g.us remoteJid for groups — falls through to number check', () => {
    // If somehow remoteJid doesn't end with @g.us, fall back to number
    const ticket = {
      isGroup: true,
      contact: {
        remoteJid: '5511999990000@s.whatsapp.net',
        number: '5511999990000',
      },
    };
    expect(buildRecipientJid(ticket)).toBe('5511999990000@g.us');
  });
});

// ─── Individual message tests ─────────────────────────────────────────────────

describe('buildRecipientJid — individual tickets', () => {
  test('returns contact.remoteJid when present', () => {
    const ticket = {
      isGroup: false,
      contact: {
        remoteJid: '5511988887777@s.whatsapp.net',
        number: '5511988887777',
      },
    };
    expect(buildRecipientJid(ticket)).toBe('5511988887777@s.whatsapp.net');
  });

  test('builds @s.whatsapp.net JID from number when remoteJid is absent', () => {
    const ticket = {
      isGroup: false,
      contact: {
        remoteJid: null,
        number: '5511988887777',
      },
    };
    expect(buildRecipientJid(ticket)).toBe('5511988887777@s.whatsapp.net');
  });

  test('builds @lid JID from number when number starts with lid_', () => {
    const ticket = {
      isGroup: false,
      contact: {
        remoteJid: null,
        number: 'lid_12345678901234567',
      },
    };
    expect(buildRecipientJid(ticket)).toBe('12345678901234567@lid');
  });

  test('builds @lid JID when number is > 15 chars (LID number format)', () => {
    const ticket = {
      isGroup: false,
      contact: {
        remoteJid: null,
        number: '1234567890123456', // 16 digits
      },
    };
    expect(buildRecipientJid(ticket)).toBe('1234567890123456@lid');
  });

  test('throws ERR_CONTACT_WITHOUT_VALID_IDENTIFIER when number starts with temp_', () => {
    const ticket = {
      isGroup: false,
      contact: {
        remoteJid: null,
        number: 'temp_1715000000000',
      },
    };
    expect(() => buildRecipientJid(ticket)).toThrow('ERR_CONTACT_WITHOUT_VALID_IDENTIFIER');
  });
});

// ─── Regression: old (buggy) behaviour would have failed these ─────────────────

describe('regression — old buggy code would have broken these', () => {
  test('OLD BUG: group with temp_ number would return invalid JID like temp_xxx@g.us', () => {
    // Demonstrates what the old code did — this is the exact bug that was fixed
    function buildRecipientJidBuggy(ticket) {
      const contact = ticket.contact;
      if (ticket.isGroup) return contact.number + '@g.us'; // <-- old code
      return contact.remoteJid || contact.number + '@s.whatsapp.net';
    }

    const ticket = {
      isGroup: true,
      contact: { remoteJid: '120363123456789012@g.us', number: 'temp_1715000000000' },
    };

    // Old code produces WRONG result
    const buggyResult = buildRecipientJidBuggy(ticket);
    expect(buggyResult).toBe('temp_1715000000000@g.us'); // invalid!
    expect(buggyResult).not.toBe('120363123456789012@g.us'); // wasn't using remoteJid

    // Fixed code produces CORRECT result
    const fixedResult = buildRecipientJid(ticket);
    expect(fixedResult).toBe('120363123456789012@g.us');
  });
});
