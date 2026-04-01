'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.upgradeBackend = exports.checkUpgrade = void 0;

const checkUpgrade = async (_req, res) => {
  return res.status(200).json({ message: 'Auto-atualização desabilitada.' });
};
exports.checkUpgrade = checkUpgrade;

const upgradeBackend = async (_req, res) => {
  return res.status(403).json({ error: 'Auto-atualização desabilitada neste servidor.' });
};
exports.upgradeBackend = upgradeBackend;
