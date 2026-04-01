'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.getInstallationId = exports.getInstallationInfo = exports.activateWhiteLabelLicense = exports.getWhiteLabelStatus = void 0;

const getWhiteLabelStatus = async (_req, res) => {
  return res.status(200).json({ active: true, message: 'White-label ativo', installationId: 'local' });
};
exports.getWhiteLabelStatus = getWhiteLabelStatus;

const activateWhiteLabelLicense = async (_req, res) => {
  return res.status(200).json({ success: true, message: 'White-label ativado com sucesso!' });
};
exports.activateWhiteLabelLicense = activateWhiteLabelLicense;

const getInstallationInfo = async (_req, res) => {
  return res.status(200).json({ installationId: 'local', systemInfo: {} });
};
exports.getInstallationInfo = getInstallationInfo;

const getInstallationId = async (_req, res) => {
  return res.status(200).json({ installationId: 'local' });
};
exports.getInstallationId = getInstallationId;
