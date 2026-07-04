//Simple Script to install Dastine based on browser type.
var TokenRemovalTimer;
var TokenRemovalTimerWaitPeriod = 500; //millisecond
var RemovalEventRunning = false;
var TokenInsertionTimer;
var TokenInsertionTimerWaitPeriod = 500; //millisecond
var InsertionEventRunning = false;
var hostUrl;
var hostUrlAltered = false;
var dedicatedPortSSL = DastineConfig.dedicatedPortSSL;
var dedicatedPort = DastineConfig.dedicatedPort;

var autoInitialize = DastineConfig.autoInitialize;
if (autoInitialize === '' || typeof autoInitialize === 'undefined')
  autoInitialize = 1;

var socketAttemptCount = 5;
if (!dedicatedPortSSL)
  hostUrl = 'wss://localhost.dastine.pki.co.ir:51357/dastine';
else
  hostUrl =
    'wss://localhost.dastine.pki.co.ir:' + dedicatedPortSSL + '/dastine';
var retriesNum = 0;
var Dastine = {
  isInstalled: false,
  socketConnection: null,
  info: 'undefined',
  errorMessage: 'DASTINE_NOT_INITIALIZED',
  socketStatus: 'close',
  jsStatus: document.readyState,
  version: '',
  jsVersion: '5.8.38.0',

  SelectCertificateFromWindowsByUICallBack: '',
  SelectCertificateFromWindowsByUI: function (
    issuer,
    keyUsages,
    callbackSelectCertificateFromWindowsByUI
  ) {
    Dastine.SelectCertificateFromWindowsByUICallBack =
      callbackSelectCertificateFromWindowsByUI;
    var msg = { command: 'SelectCertificateFromWindowsByUI' };
    msg['src'] = 'dastine.js';
    msg['issuer'] = issuer;
    msg['keyUsages'] = keyUsages;
    Dastine.TriggerDastineFunction(msg);
  },
  GetSelectedCertificateCallBack: '',
  GetSelectedCertificate: function (callbackGetSelectedCertificate) {
    Dastine.GetSelectedCertificateCallBack = callbackGetSelectedCertificate;
    var msg = { command: 'GetSelectedCertificate' };
    msg['src'] = 'dastine.js';
    Dastine.TriggerDastineFunction(msg);
  },
  GetProviderNameCallBack: '',
  GetProviderName: function (callbackGetProviderName) {
    Dastine.GetProviderNameCallBack = callbackGetProviderName;
    var msg = { command: 'GetProviderName' };
    msg['src'] = 'dastine.js';
    Dastine.TriggerDastineFunction(msg);
  },
  SelectCertificateFromTokenByUICallBack: '',
  SelectCertificateFromTokenByUI: function (
    issuer,
    keyUsages,
    callbackSelectCertificateFromTokenByUI
  ) {
    console.log(`SelectCertificateFromTokenByUI6 ${issuer} ${keyUsages}`);
    Dastine.SelectCertificateFromTokenByUICallBack =
      callbackSelectCertificateFromTokenByUI;
    var msg = { command: 'SelectCertificateFromTokenByUI' };
    msg['src'] = 'dastine.js';
    msg['issuer'] = issuer;
    msg['keyUsages'] = keyUsages;
    console.log(`SelectCertificateFromTokenByUI7 ${msg}`);
    Dastine.TriggerDastineFunction(msg);
    console.log(`SelectCertificateFromTokenByUI8 ${msg}`);
  },
  SelectCertificateFromFileByUICallBack: '',
  SelectCertificateFromFileByUI: function (
    issuer,
    keyUsages,
    p12,
    password,
    callbackSelectCertificateFromFileByUI
  ) {
    Dastine.SelectCertificateFromFileByUICallBack =
      callbackSelectCertificateFromFileByUI;
    var msg = { command: 'SelectCertificateFromFileByUI' };
    msg['src'] = 'dastine.js';
    msg['issuer'] = issuer;
    msg['keyUsages'] = keyUsages;
    msg['p12'] = p12;
    msg['password'] = password;
    Dastine.TriggerDastineFunction(msg);
  },
  SelectCertificateFromFileBySubjectCallBack: '',
  SelectCertificateFromFileBySubject: function (
    subjectDn,
    issuer,
    keyUsages,
    p12,
    password,
    callbackSelectCertificateFromFileBySubject
  ) {
    Dastine.SelectCertificateFromFileBySubjectCallBack =
      callbackSelectCertificateFromFileBySubject;
    var msg = { command: 'SelectCertificateFromFileBySubject' };
    msg['src'] = 'dastine.js';
    msg['subjectDn'] = subjectDn;
    msg['issuer'] = issuer;
    msg['keyUsages'] = keyUsages;
    msg['p12'] = p12;
    msg['password'] = password;
    Dastine.TriggerDastineFunction(msg);
  },
  SelectCertificateFromWindowsBySubjectCallBack: '',
  SelectCertificateFromWindowsBySubject: function (
    subjectDn,
    issuer,
    keyUsages,
    callbackSelectCertificateFromWindowsBySubject
  ) {
    Dastine.SelectCertificateFromWindowsBySubjectCallBack =
      callbackSelectCertificateFromWindowsBySubject;
    var msg = { command: 'SelectCertificateFromWindowsBySubject' };
    msg['src'] = 'dastine.js';
    msg['subjectDn'] = subjectDn;
    msg['issuer'] = issuer;
    msg['keyUsages'] = keyUsages;
    Dastine.TriggerDastineFunction(msg);
  },
  SelectCertificateFromTokenBySubjectCallBack: '',
  SelectCertificateFromTokenBySubject: function (
    subjectDn,
    issuer,
    keyUsages,
    callbackSelectCertificateFromTokenBySubject
  ) {
    Dastine.SelectCertificateFromTokenBySubjectCallBack =
      callbackSelectCertificateFromTokenBySubject;
    var msg = { command: 'SelectCertificateFromTokenBySubject' };
    msg['src'] = 'dastine.js';
    msg['subjectDn'] = subjectDn;
    msg['issuer'] = issuer;
    msg['keyUsages'] = keyUsages;
    Dastine.TriggerDastineFunction(msg);
  },
  SelectCertificateByThumbprintCallBack: '',
  SelectCertificateByThumbprint: function (
    thumbprint,
    hashAlg,
    callbackSelectCertificateByThumbprint
  ) {
    Dastine.SelectCertificateByThumbprintCallBack =
      callbackSelectCertificateByThumbprint;
    var msg = { command: 'SelectCertificateByThumbprint' };
    msg['src'] = 'dastine.js';
    msg['Thumbprint'] = thumbprint;
    msg['hashAlg'] = hashAlg;
    Dastine.TriggerDastineFunction(msg);
  },
  FindCertificateFromTokenCallBack: '',
  FindCertificateFromToken: function (
    issuer,
    keyUsages,
    callbackFindCertificateFromToken
  ) {
    Dastine.FindCertificateFromTokenCallBack = callbackFindCertificateFromToken;
    var msg = { command: 'FindCertificateFromToken' };
    msg['src'] = 'dastine.js';
    msg['issuer'] = issuer;
    msg['keyUsages'] = keyUsages;
    Dastine.TriggerDastineFunction(msg);
  },
  ListTokensCallBack: '',
  ListTokens: function (callbackListTokens) {
    Dastine.ListTokensCallBack = callbackListTokens;
    var msg = { command: 'ListTokens' };
    msg['src'] = 'dastine.js';
    Dastine.TriggerDastineFunction(msg);
  },
  GenerateKeyPairAndCertificateRequestCallBack: '',
  GenerateKeyPairAndCertificateRequest: function (
    subjectDn,
    keyLen,
    token,
    callbackGenerateKeyPairAndCertificateRequest
  ) {
    Dastine.GenerateKeyPairAndCertificateRequestCallBack =
      callbackGenerateKeyPairAndCertificateRequest;
    var msg = { command: 'GenerateKeyPairAndCertificateRequest' };
    msg['src'] = 'dastine.js';
    msg['subjectDn'] = subjectDn;
    msg['keyLen'] = keyLen;
    msg['token'] = token;
    Dastine.TriggerDastineFunction(msg);
  },
  GenerateKeyPairAndCertificateRequestWithSANSCallBack: '',
  GenerateKeyPairAndCertificateRequestWithSANS: function (
    subjectDn,
    keyLen,
    token,
    upn,
    rfc822,
    dns,
    directory,
    uri,
    ip,
    id,
    callbackGenerateKeyPairAndCertificateRequestWithSANS
  ) {
    Dastine.GenerateKeyPairAndCertificateRequestWithSANSCallBack =
      callbackGenerateKeyPairAndCertificateRequestWithSANS;
    var msg = { command: 'GenerateKeyPairAndCertificateRequestWithSANS' };
    msg['src'] = 'dastine.js';
    msg['subjectDn'] = subjectDn;
    msg['keyLen'] = keyLen;
    msg['token'] = token;
    msg['upn'] = upn;
    msg['rfc822'] = rfc822;
    msg['dns'] = dns;
    msg['directory'] = directory;
    msg['uri'] = uri;
    msg['ip'] = ip;
    msg['id'] = id;

    Dastine.TriggerDastineFunction(msg);
  },
  GenerateKeyPairAndCertificateRequestOnSelectedCertificateCallBack: '',
  GenerateKeyPairAndCertificateRequestOnSelectedCertificate: function (
    subjectDn,
    keyLen,
    token,
    callbackGenerateKeyPairAndCertificateRequestOnSelectedCertificate
  ) {
    Dastine.GenerateKeyPairAndCertificateRequestOnSelectedCertificateCallBack =
      callbackGenerateKeyPairAndCertificateRequestOnSelectedCertificate;
    var msg = {
      command: 'GenerateKeyPairAndCertificateRequestOnSelectedCertificate',
    };
    msg['src'] = 'dastine.js';
    msg['subjectDn'] = subjectDn;
    msg['keyLen'] = keyLen;
    msg['token'] = token;
    Dastine.TriggerDastineFunction(msg);
  },
  GenerateCertificateRequestBySelectedCertificateCallBack: '',
  GenerateCertificateRequestBySelectedCertificate: function (
    callbackGenerateCertificateRequestBySelectedCertificate
  ) {
    Dastine.GenerateCertificateRequestBySelectedCertificateCallBack =
      callbackGenerateCertificateRequestBySelectedCertificate;
    var msg = { command: 'GenerateCertificateRequestBySelectedCertificate' };
    msg['src'] = 'dastine.js';
    Dastine.TriggerDastineFunction(msg);
  },
  ImportIssuedCertificateCallBack: '',
  ImportIssuedCertificate: function (
    certificate,
    callbackImportIssuedCertificate
  ) {
    Dastine.ImportIssuedCertificateCallBack = callbackImportIssuedCertificate;
    var msg = { command: 'ImportIssuedCertificate' };
    msg['src'] = 'dastine.js';
    msg['certificate'] = certificate;
    Dastine.TriggerDastineFunction(msg);
  },
  ImportIssuedCertificateOnSelectedCertificateCallBack: '',
  ImportIssuedCertificateOnSelectedCertificate: function (
    certificate,
    callbackImportIssuedCertificateOnSelectedCertificate
  ) {
    Dastine.ImportIssuedCertificateOnSelectedCertificateCallBack =
      callbackImportIssuedCertificateOnSelectedCertificate;
    var msg = { command: 'ImportIssuedCertificateOnSelectedCertificate' };
    msg['src'] = 'dastine.js';
    msg['certificate'] = certificate;
    Dastine.TriggerDastineFunction(msg);
  },
  SignCallBack: '',
  Sign: function (data, hash, callbackSign) {
    Dastine.SignCallBack = callbackSign;
    var msg = { command: 'Sign' };
    msg['src'] = 'dastine.js';
    msg['data'] = data;
    msg['hash'] = hash;
    Dastine.TriggerDastineFunction(msg);
  },
  CmsSignCallBack: '',
  CmsSign: function (data, attach, callbackCmsSign, hash) {
    Dastine.CmsSignCallBack = callbackCmsSign;
    var msg = { command: 'CmsSign' };
    msg['src'] = 'dastine.js';
    msg['data'] = data;
    msg['attach'] = attach;
    if (hash == undefined) hash = 'SHA1';
    msg['hash'] = hash;
    Dastine.TriggerDastineFunction(msg);
  },
  CmsSignWithAttributesCallBack: '',
  CmsSignWithAttributes: function (
    data,
    AuthenticatedAttributes,
    UnAuthenticatedAttributes,
    callbackCmsSignWithAttributes
  ) {
    Dastine.CmsSignWithAttributesCallBack = callbackCmsSignWithAttributes;
    var msg = { command: 'CmsSignWithAttributes' };
    msg['src'] = 'dastine.js';
    msg['data'] = data;
    msg['AuthenticatedAttributes'] = AuthenticatedAttributes;
    msg['UnAuthenticatedAttributes'] = UnAuthenticatedAttributes;
    Dastine.TriggerDastineFunction(msg);
  },
  CmsDecryptCallBack: '',
  CmsDecrypt: function (cipher, callbackCmsDecrypt) {
    Dastine.CmsDecryptCallBack = callbackCmsDecrypt;
    var msg = { command: 'CmsDecrypt' };
    msg['src'] = 'dastine.js';
    msg['cipher'] = cipher;
    Dastine.TriggerDastineFunction(msg);
  },
  DecryptCallBack: '',
  Decrypt: function (cipher, callbackDecrypt) {
    Dastine.DecryptCallBack = callbackDecrypt;
    var msg = { command: 'Decrypt' };
    msg['src'] = 'dastine.js';
    msg['cipher'] = cipher;
    Dastine.TriggerDastineFunction(msg);
  },
  Base64ToUnicodeCallBack: '',
  Base64ToUnicode: function (base64Str, callbackBase64ToUnicode) {
    var event = ['data'];
    event.data = ['Result'];
    //event.data.Result=jsunicode.decode(base64Str, { encoding: "UTF-16LE", byteReader: "base64" });
    event.data.Result = base64ToUtf16le(base64Str);
    Dastine.Base64ToUnicodeCallBack = callbackBase64ToUnicode;
    Dastine.Base64ToUnicodeCallBack(event);
    /*var msg = {command: "Base64ToUnicode"};
		msg["src"] = "dastine.js";
		msg["base64Str"] = base64Str;
		Dastine.TriggerDastineFunction(msg);	*/
  },
  UnicodeToBase64CallBack: '',
  UnicodeToBase64: function (unicodeStr, callbackUnicodeToBase64) {
    var event = ['data'];
    event.data = ['Result'];
    //event.data.Result=jsunicode.encode(unicodeStr, { encoding: "UTF-16LE", byteWriter: "base64" });
    event.data.Result = utf16leToBase64(unicodeStr);
    Dastine.UnicodeToBase64CallBack = callbackUnicodeToBase64;
    Dastine.UnicodeToBase64CallBack(event);
    /*var msg = {command: "UnicodeToBase64"};
		msg["src"] = "dastine.js";
		msg["unicodeStr"] = unicodeStr;
		Dastine.TriggerDastineFunction(msg);	*/
  },
  RemoveSelectedCertificateCallBack: '',
  RemoveSelectedCertificate: function (callbackRemoveSelectedCertificate) {
    Dastine.RemoveSelectedCertificateCallBack =
      callbackRemoveSelectedCertificate;
    var msg = { command: 'RemoveSelectedCertificate' };
    msg['src'] = 'dastine.js';
    Dastine.TriggerDastineFunction(msg);
  },
  RemoveGeneratedKeyPairCallBack: '',
  RemoveGeneratedKeyPair: function (callbackRemoveGeneratedKeyPair) {
    Dastine.RemoveGeneratedKeyPairCallBack = callbackRemoveGeneratedKeyPair;
    var msg = { command: 'RemoveGeneratedKeyPair' };
    msg['src'] = 'dastine.js';
    Dastine.TriggerDastineFunction(msg);
  },
  GetVersionCallBack: '',
  GetVersion: function (callbackGetVersion) {
    Dastine.GetVersionCallBack = callbackGetVersion;
    var msg = { command: 'GetVersion' };
    msg['src'] = 'dastine.js';
    Dastine.TriggerDastineFunction(msg);
  },
  SetTokenRemoveEventCallBack: '',
  TokenRemoveHandler: '',
  SetTokenRemoveEvent: function (
    callbackSetTokenRemoveEvent,
    callbackTokenRemoveHandler
  ) {
    Dastine.SetTokenRemoveEventCallBack = callbackSetTokenRemoveEvent;
    Dastine.TokenRemoveHandler = callbackTokenRemoveHandler;
    var msg = { command: 'SetTokenRemoveEvent' };
    msg['src'] = 'dastine.js';
    RemovalEventRunning = true;
    Dastine.TriggerDastineFunction(msg);
  },
  SetTokenInsertEventCallBack: '',
  TokenInsertHandler: '',
  SetTokenInsertEvent: function (
    callbackSetTokenInsertEvent,
    callbackTokenInsertHandler
  ) {
    Dastine.SetTokenInsertEventCallBack = callbackSetTokenInsertEvent;
    Dastine.TokenInsertHandler = callbackTokenInsertHandler;
    var msg = { command: 'SetTokenInsertEvent' };
    msg['src'] = 'dastine.js';
    InsertionEventRunning = true;
    Dastine.TriggerDastineFunction(msg);
  },
  SetAdminKeyCallBack: '',
  SetAdminKey: function (adminKey, token, callbackSetAdminKey) {
    Dastine.SetAdminKeyCallBack = callbackSetAdminKey;
    var msg = { command: 'SetAdminKey' };
    msg['src'] = 'dastine.js';
    msg['adminKey'] = adminKey;
    msg['token'] = token;
    Dastine.TriggerDastineFunction(msg);
  },
  ChangePINCallBack: '',
  ChangePIN: function (token, callbackChangePIN) {
    Dastine.ChangePINCallBack = callbackChangePIN;
    var msg = { command: 'ChangePIN' };
    msg['src'] = 'dastine.js';
    msg['token'] = token;
    Dastine.TriggerDastineFunction(msg);
  },
  SetPINCallBack: '',
  SetPIN: function (pin, token, callbackSetPIN) {
    Dastine.SetPINCallBack = callbackSetPIN;
    var msg = { command: 'SetPIN' };
    msg['src'] = 'dastine.js';
    msg['pin'] = pin;
    msg['token'] = token;
    Dastine.TriggerDastineFunction(msg);
  },
  SetConfigCallBack: '',
  SetConfig: function (config, callbackSetConfig) {
    Dastine.SetConfigCallBack = callbackSetConfig;
    var msg = { command: 'SetConfig' };
    msg['src'] = 'dastine.js';
    msg['config'] = config;
    Dastine.TriggerDastineFunction(msg);
  },
  ResetCallBack: '',
  Reset: function (callbackReset) {
    Dastine.ResetCallBack = callbackReset;
    var msg = { command: 'Reset' };
    msg['src'] = 'dastine.js';
    Dastine.TriggerDastineFunction(msg);
  },
  ReadSignatureImageCallBack: '',
  ReadSignatureImage: function (callbackReadSignatureImage) {
    Dastine.ReadSignatureImageCallBack = callbackReadSignatureImage;
    var msg = { command: 'ReadSignatureImage' };
    msg['src'] = 'dastine.js';
    Dastine.TriggerDastineFunction(msg);
  },
  ReadFingerprintImageCallBack: '',
  ReadFingerprintImage: function (callbackReadFingerprintImage) {
    Dastine.ReadFingerprintImageCallBack = callbackReadFingerprintImage;
    var msg = { command: 'ReadFingerprintImage' };
    msg['src'] = 'dastine.js';
    Dastine.TriggerDastineFunction(msg);
  },
  ReadFaceImageCallBack: '',
  ReadFaceImage: function (callbackReadFaceImage) {
    Dastine.ReadFaceImageCallBack = callbackReadFaceImage;
    var msg = { command: 'ReadFaceImage' };
    msg['src'] = 'dastine.js';
    Dastine.TriggerDastineFunction(msg);
  },
  ReadValidationDataCallBack: '',
  ReadValidationData: function (callbackReadValidationData) {
    Dastine.ReadValidationDataCallBack = callbackReadValidationData;
    var msg = { command: 'ReadValidationData' };
    msg['src'] = 'dastine.js';
    Dastine.TriggerDastineFunction(msg);
  },
  ReadPrintedDataCallBack: '',
  ReadPrintedData: function (callbackReadPrintedData) {
    Dastine.ReadPrintedDataCallBack = callbackReadPrintedData;
    var msg = { command: 'ReadPrintedData' };
    msg['src'] = 'dastine.js';
    Dastine.TriggerDastineFunction(msg);
  },
  ImportCertificateFromFileToTokenCallBack: '',
  ImportCertificateFromFileToToken: function (
    p12,
    pass,
    token,
    keyContainer,
    callbackImportCertificateFromFileToToken
  ) {
    Dastine.ImportCertificateFromFileToTokenCallBack =
      callbackImportCertificateFromFileToToken;
    var msg = { command: 'ImportCertificateFromFileToToken' };
    msg['src'] = 'dastine.js';
    msg['p12'] = p12;
    msg['pass'] = pass;
    msg['token'] = token;
    msg['keyContainer'] = keyContainer;
    Dastine.TriggerDastineFunction(msg);
  },
  UnblockPINCallBack: '',
  UnblockPIN: function (token, callbackUnblockPIN) {
    Dastine.UnblockPINCallBack = callbackUnblockPIN;
    var msg = { command: 'UnblockPIN' };
    msg['src'] = 'dastine.js';
    msg['token'] = token;
    Dastine.TriggerDastineFunction(msg);
  },
  SetIDinCardCallBack: '',
  SetIDinCard: function (serialNumber, callbackSetIDinCard) {
    Dastine.SetIDinCardCallBack = callbackSetIDinCard;
    var msg = { command: 'SetIDinCard' };
    msg['src'] = 'dastine.js';
    msg['serialNumber'] = serialNumber;
    Dastine.TriggerDastineFunction(msg);
  },
  SetIDinCardIndexForIssuanceCallBack: '',
  SetIDinCardIndexForIssuance: function (
    index,
    callbackSetIDinCardIndexForIssuance
  ) {
    Dastine.SetIDinCardIndexForIssuanceCallBack =
      callbackSetIDinCardIndexForIssuance;
    var msg = { command: 'SetIDinCardIndexForIssuance' };
    msg['src'] = 'dastine.js';
    msg['index'] = index;
    Dastine.TriggerDastineFunction(msg);
  },
  ReadSerialNumberCallBack: '',
  ReadSerialNumber: function (callbackReadSerialNumber) {
    Dastine.ReadSerialNumberCallBack = callbackReadSerialNumber;
    var msg = { command: 'ReadSerialNumber' };
    msg['src'] = 'dastine.js';
    Dastine.TriggerDastineFunction(msg);
  },
  ReadIDinCardsSerialNumberCallBack: '',
  ReadIDinCardsSerialNumber: function (callbackReadIDinCardsSerialNumber) {
    Dastine.ReadIDinCardsSerialNumberCallBack =
      callbackReadIDinCardsSerialNumber;
    var msg = { command: 'ReadIDinCardsSerialNumber' };
    msg['src'] = 'dastine.js';
    Dastine.TriggerDastineFunction(msg);
  },
  ReadExtendedPrintedDataCallBack: '',
  ReadExtendedPrintedData: function (callbackReadExtendedPrintedData) {
    Dastine.ReadExtendedPrintedDataCallBack = callbackReadExtendedPrintedData;
    var msg = { command: 'ReadExtendedPrintedData' };
    msg['src'] = 'dastine.js';
    Dastine.TriggerDastineFunction(msg);
  },
  ReadCustomFieldCallBack: '',
  ReadCustomField: function (index, callbackReadCustomField) {
    Dastine.ReadCustomFieldCallBack = callbackReadCustomField;
    var msg = { command: 'ReadCustomField' };
    msg['src'] = 'dastine.js';
    msg['index'] = index;
    Dastine.TriggerDastineFunction(msg);
  },
  CaptureFingerPrintCallBack: '',
  CaptureFingerPrint: function (scannername, callbackCaptureFingerPrint) {
    Dastine.CaptureFingerPrintCallBack = callbackCaptureFingerPrint;
    var msg = { command: 'CaptureFingerPrint' };
    msg['src'] = 'dastine.js';
    msg['scannername'] = scannername;
    Dastine.TriggerDastineFunction(msg);
  },
  GetFingerPrintScannerSupportedDevicesCallBack: '',
  GetFingerPrintScannerSupportedDevices: function (
    callbackGetFingerPrintScannerSupportedDevices
  ) {
    Dastine.GetFingerPrintScannerSupportedDevicesCallBack =
      callbackGetFingerPrintScannerSupportedDevices;
    var msg = { command: 'GetFingerPrintScannerSupportedDevices' };
    msg['src'] = 'dastine.js';
    Dastine.TriggerDastineFunction(msg);
  },
  CheckUpdateCallBack: '',
  CheckUpdate: function (callbackCheckUpdate) {
    Dastine.CheckUpdateCallBack = callbackCheckUpdate;
    var msg = { command: 'CheckUpdate' };
    msg['src'] = 'dastine.js';
    Dastine.TriggerDastineFunction(msg);
  },
  InstallUpdateCallBack: '',
  InstallUpdate: function (callbackInstallUpdate) {
    Dastine.InstallUpdateCallBack = callbackInstallUpdate;
    var msg = { command: 'InstallUpdate' };
    msg['src'] = 'dastine.js';
    Dastine.TriggerDastineFunction(msg);
  },
  NIDGetFingerIndexCallBack: '',
  NIDGetFingerIndex: function (cardReader, callbackNIDGetFingerIndex) {
    Dastine.NIDGetFingerIndexCallBack = callbackNIDGetFingerIndex;
    var msg = { command: 'NIDGetFingerIndex' };
    msg['cardReader'] = cardReader;
    msg['src'] = 'dastine.js';
    Dastine.TriggerDastineFunction(msg);
  },
  NIDAuthenticateByPINCallBack: '',
  NIDAuthenticateByPIN: function (cardReader, callbackNIDAuthenticateByPIN) {
    Dastine.NIDAuthenticateByPINCallBack = callbackNIDAuthenticateByPIN;
    var msg = { command: 'NIDAuthenticateByPIN' };
    msg['cardReader'] = cardReader;
    msg['src'] = 'dastine.js';
    Dastine.TriggerDastineFunction(msg);
  },
  NIDAuthenticateByFingerUICallBack: '',
  NIDAuthenticateByFingerUI: function (
    cardReader,
    callbackNIDAuthenticateByFingerUI
  ) {
    Dastine.NIDAuthenticateByFingerUICallBack =
      callbackNIDAuthenticateByFingerUI;
    var msg = { command: 'NIDAuthenticateByFingerUI' };
    msg['cardReader'] = cardReader;
    msg['src'] = 'dastine.js';
    Dastine.TriggerDastineFunction(msg);
  },
  NIDAuthenticateByFingerCallBack: '',
  NIDAuthenticateByFinger: function (
    cardReader,
    index,
    imageData,
    imageWidth,
    imageHeight,
    imageResolution,
    callbackNIDAuthenticateByFinger
  ) {
    Dastine.NIDAuthenticateByFingerCallBack = callbackNIDAuthenticateByFinger;
    var msg = { command: 'NIDAuthenticateByFinger' };
    msg['cardReader'] = cardReader;
    msg['src'] = 'dastine.js';
    msg['index'] = index;
    msg['imageData'] = imageData;
    msg['imageWidth'] = imageWidth;
    msg['imageHeight'] = imageHeight;
    msg['imageResolution'] = imageResolution;
    Dastine.TriggerDastineFunction(msg);
  },
  NIDSignCallBack: '',
  NIDSign: function (cardReader, data, callbackNIDSign) {
    Dastine.NIDSignCallBack = callbackNIDSign;
    var msg = { command: 'NIDSign' };
    msg['cardReader'] = cardReader;
    msg['data'] = data;
    msg['src'] = 'dastine.js';
    Dastine.TriggerDastineFunction(msg);
  },
  NIDChangePINCallBack: '',
  NIDChangePIN: function (
    cardReader,
    pinType,
    oldPIN,
    newPIN,
    callbackNIDChangePIN
  ) {
    Dastine.NIDChangePINCallBack = callbackNIDChangePIN;
    var msg = { command: 'NIDChangePIN' };
    msg['cardReader'] = cardReader;
    msg['pinType'] = pinType;
    msg['oldPIN'] = oldPIN;
    msg['newPIN'] = newPIN;
    msg['src'] = 'dastine.js';
    Dastine.TriggerDastineFunction(msg);
  },
  NIDUnblockPINCallBack: '',
  NIDUnblockPIN: function (cardReader, pinType, callbackNIDUnblockPIN) {
    Dastine.NIDUnblockPINCallBack = callbackNIDUnblockPIN;
    var msg = { command: 'NIDUnblockPIN' };
    msg['cardReader'] = cardReader;
    msg['pinType'] = pinType;
    msg['src'] = 'dastine.js';
    Dastine.TriggerDastineFunction(msg);
  },
  NIDSetDSAuthTokenCallBack: '',
  NIDSetDSAuthToken: function (token, callbackNIDSetDSAuthToken) {
    Dastine.NIDSetDSAuthTokenCallBack = callbackNIDSetDSAuthToken;
    var msg = { command: 'NIDSetDSAuthToken' };
    msg['token'] = token;
    msg['src'] = 'dastine.js';
    Dastine.TriggerDastineFunction(msg);
  },
  SetPINGuideCallBack: '',
  SetPINGuide: function (pinGuide, callbackSetPINGuide) {
    Dastine.SetPINGuideCallBack = callbackSetPINGuide;
    var msg = { command: 'SetPINGuide' };
    msg['src'] = 'dastine.js';
    msg['pinGuide'] = pinGuide;
    Dastine.TriggerDastineFunction(msg);
  },
  TriggerDastineFunction: function (msg) {
    try {
      Dastine.jsStatus = document.readyState;
      if (
        Dastine.socketConnection.readyState == 1 &&
        document.readyState == 'complete'
      ) {
        Dastine.jsStatus = document.readyState;
        msg['info'] = Dastine.info;
        Dastine.socketConnection.send(JSON.stringify(msg));
      } else {
        setTimeout(function () {
          Dastine.TriggerDastineFunction(msg);
        }, 100);
      }
    } catch (e) {
      Dastine.jsStatus = document.readyState;
      console.log(e);
      if (DastineConfig.debug == 1)
        Dastine.errorMessage =
          'DASTINE_NOT_INSTALLED\n' +
          BrowserDetector.OS +
          '\n' +
          BrowserDetector.browser +
          '\n' +
          hostUrl +
          '\n socket status:' +
          Dastine.socketStatus +
          '\nRetries number:' +
          retriesNum +
          '\n js status:' +
          Dastine.jsStatus +
          '\nError:' +
          e +
          '\nisinstalled:' +
          Dastine.isInstalled;
      else if (Dastine.socketStatus == 'opening')
        Dastine.errorMessage = 'WAITING_FOR_DASTINE_SERVICE';
      else if (Dastine.socketStatus == 'failed')
        Dastine.errorMessage = 'DASTINE_NOT_INSTALLED';
      else if (Dastine.socketStatus == 'closed')
        Dastine.errorMessage = 'DASTINE_SERVICE_IS_CLOSED';
      else Dastine.errorMessage = e;
    }
  },
  TriggerDastineOutput: function (event) {
    Dastine.jsStatus = document.readyState;
    var event = Dastine.CheckResult('', event.data);
    if (event.data.command) {
      switch (event.data.command) {
        case 'SelectCertificateFromWindowsByUI':
          if (Dastine.SelectCertificateFromWindowsByUICallBack) {
            Dastine.SelectCertificateFromWindowsByUICallBack(event);
            clearInterval(TokenRemovalTimer);
            RemovalEventRunning = false;
          } else console.log('Dastine method callback not set.');
          break;
        case 'SelectCertificateFromWindowsBySubject':
          if (Dastine.SelectCertificateFromWindowsBySubjectCallBack) {
            Dastine.SelectCertificateFromWindowsBySubjectCallBack(event);
            clearInterval(TokenRemovalTimer);
            RemovalEventRunning = false;
          } else console.log('Dastine method callback not set.');
          break;

        case 'SelectCertificateFromTokenByUI':
          console.log('SelectCertificateFromTokenByUI11111111');
          if (Dastine.SelectCertificateFromTokenByUICallBack) {
            console.log('SelectCertificateFromTokenByUI');
            Dastine.SelectCertificateFromTokenByUICallBack(event);
            clearInterval(TokenRemovalTimer);
            RemovalEventRunning = false;
          } else console.log('Dastine method callback not set.');
          break;

        case 'SelectCertificateFromTokenBySubject':
          if (Dastine.SelectCertificateFromTokenBySubjectCallBack) {
            Dastine.SelectCertificateFromTokenBySubjectCallBack(event);
            clearInterval(TokenRemovalTimer);
            RemovalEventRunning = false;
          } else console.log('Dastine method callback not set.');
          break;
        case 'SelectCertificateFromFileByUI':
          if (Dastine.SelectCertificateFromFileByUICallBack) {
            Dastine.SelectCertificateFromFileByUICallBack(event);
            clearInterval(TokenRemovalTimer);
            RemovalEventRunning = false;
          } else console.log('Dastine method callback not set.');
          break;
        case 'SelectCertificateFromFileBySubject':
          if (Dastine.SelectCertificateFromFileBySubjectCallBack) {
            Dastine.SelectCertificateFromFileBySubjectCallBack(event);
            clearInterval(TokenRemovalTimer);
            RemovalEventRunning = false;
          } else console.log('Dastine method callback not set.');
          break;
        case 'SelectCertificateByThumbprint':
          if (Dastine.SelectCertificateByThumbprintCallBack) {
            Dastine.SelectCertificateByThumbprintCallBack(event);
            clearInterval(TokenRemovalTimer);
            RemovalEventRunning = false;
          } else console.log('Dastine method callback not set.');
          break;
        case 'FindCertificateFromToken':
          if (Dastine.FindCertificateFromTokenCallBack) {
            if (event.data.Result.length > 3) {
              //event.data.Result= jsunicode.decode(event.data.Result, { encoding: "UTF-16LE", byteReader: "base64" });
              event.data.Result = base64ToUtf16le(event.data.Result);
              Dastine.FindCertificateFromTokenCallBack(event);
            } else {
              Dastine.FindCertificateFromTokenCallBack(event);
            }
          } else console.log('Dastine method callback not set.');
          break;
        case 'Sign':
          if (Dastine.SignCallBack) Dastine.SignCallBack(event);
          else console.log('Dastine method callback not set.');
          break;
        case 'CmsSign':
          if (Dastine.CmsSignCallBack) {
            Dastine.CmsSignCallBack(event);
          } else console.log('Dastine method callback not set.');
          break;
        case 'CmsSignWithAttributes':
          if (Dastine.CmsSignWithAttributesCallBack)
            Dastine.CmsSignWithAttributesCallBack(event);
          else console.log('Dastine method callback not set.');
          break;
        case 'CmsDecrypt':
          if (Dastine.CmsDecryptCallBack) Dastine.CmsDecryptCallBack(event);
          else console.log('Dastine method callback not set.');
          break;
        case 'Decrypt':
          if (Dastine.DecryptCallBack) Dastine.DecryptCallBack(event);
          else console.log('Dastine method callback not set.');
          break;
        case 'GetSelectedCertificate':
          if (Dastine.GetSelectedCertificateCallBack)
            Dastine.GetSelectedCertificateCallBack(event);
          else console.log('Dastine method callback not set.');
          break;
        case 'GetProviderName':
          if (Dastine.GetProviderNameCallBack)
            Dastine.GetProviderNameCallBack(event);
          else console.log('Dastine method callback not set.');
          break;
        case 'ListTokens':
          if (Dastine.ListTokensCallBack) Dastine.ListTokensCallBack(event);
          else console.log('Dastine method callback not set.');
          break;
        case 'GenerateKeyPairAndCertificateRequest':
          if (Dastine.GenerateKeyPairAndCertificateRequestCallBack)
            Dastine.GenerateKeyPairAndCertificateRequestCallBack(event);
          else console.log('Dastine method callback not set.');
          break;
        case 'GenerateKeyPairAndCertificateRequestWithSANS':
          if (Dastine.GenerateKeyPairAndCertificateRequestWithSANSCallBack)
            Dastine.GenerateKeyPairAndCertificateRequestWithSANSCallBack(event);
          else console.log('Dastine method callback not set.');
          break;
        case 'GenerateKeyPairAndCertificateRequestOnSelectedCertificate':
          if (
            Dastine.GenerateKeyPairAndCertificateRequestOnSelectedCertificateCallBack
          )
            Dastine.GenerateKeyPairAndCertificateRequestOnSelectedCertificateCallBack(
              event
            );
          else console.log('Dastine method callback not set.');
          break;
        case 'GenerateCertificateRequestBySelectedCertificate':
          if (Dastine.GenerateCertificateRequestBySelectedCertificateCallBack)
            Dastine.GenerateCertificateRequestBySelectedCertificateCallBack(
              event
            );
          else console.log('Dastine method callback not set.');
          break;
        case 'ImportIssuedCertificate':
          if (Dastine.ImportIssuedCertificateCallBack)
            Dastine.ImportIssuedCertificateCallBack(event);
          else console.log('Dastine method callback not set.');
          break;
        case 'ImportIssuedCertificateOnSelectedCertificate':
          if (Dastine.ImportIssuedCertificateOnSelectedCertificateCallBack)
            Dastine.ImportIssuedCertificateOnSelectedCertificateCallBack(event);
          else console.log('Dastine method callback not set.');
          break;
        case 'Base64ToUnicode':
          if (Dastine.Base64ToUnicodeCallBack)
            Dastine.Base64ToUnicodeCallBack(event);
          else console.log('Dastine method callback not set.');
          break;
        case 'UnicodeToBase64':
          if (Dastine.UnicodeToBase64CallBack)
            Dastine.UnicodeToBase64CallBack(event);
          else console.log('Dastine method callback not set.');
          break;
        case 'RemoveSelectedCertificate':
          if (Dastine.RemoveSelectedCertificateCallBack)
            Dastine.RemoveSelectedCertificateCallBack(event);
          else console.log('Dastine method callback not set.');
          break;
        case 'RemoveGeneratedKeyPair':
          if (Dastine.RemoveGeneratedKeyPairCallBack)
            Dastine.RemoveGeneratedKeyPairCallBack(event);
          else console.log('Dastine method callback not set.');
          break;
        case 'GetVersion':
          if (Dastine.GetVersionCallBack) Dastine.GetVersionCallBack(event);
          else console.log('Dastine method callback not set.');
          break;
        case 'SetTokenRemoveEvent':
          if (Dastine.SetTokenRemoveEventCallBack) {
            if (event.data.Result == '0') Dastine.ListenForTokenRemovel();
            Dastine.SetTokenRemoveEventCallBack(event);
          } else console.log('Dastine method callback not set.');
          break;
        case 'SetTokenInsertEvent':
          if (Dastine.SetTokenInsertEventCallBack) {
            if (event.data.Result == '0') Dastine.ListenForTokenInsertion();
            Dastine.SetTokenInsertEventCallBack(event);
          } else console.log('Dastine method callback not set.');
          break;
        case 'Reset':
          if (Dastine.ResetCallBack) {
            clearInterval(TokenRemovalTimer);
            RemovalEventRunning = false;
            clearInterval(TokenInsertionTimer);
            InsertionEventRunning = false;
            Dastine.ResetCallBack(event);
          } else console.log('Dastine method callback not set.');
          break;
        case 'SetAdminKey':
          if (Dastine.SetAdminKeyCallBack) Dastine.SetAdminKeyCallBack(event);
          else console.log('Dastine method callback not set.');
          break;
        case 'ChangePIN':
          if (Dastine.ChangePINCallBack) Dastine.ChangePINCallBack(event);
          else console.log('Dastine method callback not set.');
          break;
        case 'SetConfig':
          if (Dastine.SetConfigCallBack) Dastine.SetConfigCallBack(event);
          else console.log('Dastine method callback not set.');
          break;
        case 'ReadSignatureImage':
          if (Dastine.ReadSignatureImageCallBack)
            Dastine.ReadSignatureImageCallBack(event);
          else console.log('Dastine method callback not set.');
          break;
        case 'ReadFaceImage':
          if (Dastine.ReadFaceImageCallBack)
            Dastine.ReadFaceImageCallBack(event);
          else console.log('Dastine method callback not set.');
          break;
        case 'ReadFingerprintImage':
          if (Dastine.ReadFingerprintImageCallBack)
            Dastine.ReadFingerprintImageCallBack(event);
          else console.log('Dastine method callback not set.');
          break;
        case 'ReadPrintedData':
          if (Dastine.ReadPrintedDataCallBack)
            Dastine.ReadPrintedDataCallBack(event);
          else console.log('Dastine method callback not set.');
          break;
        case 'ReadValidationData':
          if (Dastine.ReadValidationDataCallBack)
            Dastine.ReadValidationDataCallBack(event);
          else console.log('Dastine method callback not set.');
          break;
        case 'SetPIN':
          if (Dastine.SetPINCallBack) Dastine.SetPINCallBack(event);
          else console.log('Dastine method callback not set.');
          break;
        case 'ImportCertificateFromFileToToken':
          if (Dastine.ImportCertificateFromFileToTokenCallBack)
            Dastine.ImportCertificateFromFileToTokenCallBack(event);
          else console.log('Dastine method callback not set.');
          break;
        case 'UnblockPIN':
          if (Dastine.UnblockPINCallBack) Dastine.UnblockPINCallBack(event);
          else console.log('Dastine method callback not set.');
          break;
        case 'SetIDinCard':
          if (Dastine.SetIDinCardCallBack) Dastine.SetIDinCardCallBack(event);
          else console.log('Dastine method callback not set.');
          break;
        case 'SetPINGuide':
          if (Dastine.SetPINGuideCallBack) Dastine.SetPINGuideCallBack(event);
          else console.log('Dastine method callback not set.');
          break;
        case 'SetIDinCardIndexForIssuance':
          if (Dastine.SetIDinCardIndexForIssuanceCallBack)
            Dastine.SetIDinCardIndexForIssuanceCallBack(event);
          else console.log('Dastine method callback not set.');
          break;
        case 'ReadSerialNumber':
          if (Dastine.ReadSerialNumberCallBack)
            Dastine.ReadSerialNumberCallBack(event);
          else console.log('Dastine method callback not set.');
          break;
        case 'ReadIDinCardsSerialNumber':
          if (Dastine.ReadIDinCardsSerialNumberCallBack)
            Dastine.ReadIDinCardsSerialNumberCallBack(event);
          else console.log('Dastine method callback not set.');
          break;
        case 'ReadExtendedPrintedData':
          if (Dastine.ReadExtendedPrintedDataCallBack)
            Dastine.ReadExtendedPrintedDataCallBack(event);
          else console.log('Dastine method callback not set.');
          break;
        case 'ReadCustomField':
          if (Dastine.ReadCustomFieldCallBack)
            Dastine.ReadCustomFieldCallBack(event);
          else console.log('Dastine method callback not set.');
          break;
        case 'CaptureFingerPrint':
          if (Dastine.CaptureFingerPrintCallBack)
            Dastine.CaptureFingerPrintCallBack(event);
          else console.log('Dastine method callback not set.');
          break;
        case 'GetFingerPrintScannerSupportedDevices':
          if (Dastine.GetFingerPrintScannerSupportedDevicesCallBack)
            Dastine.GetFingerPrintScannerSupportedDevicesCallBack(event);
          else console.log('Dastine method callback not set.');
          break;
        case 'CheckUpdate':
          if (Dastine.CheckUpdateCallBack) Dastine.CheckUpdateCallBack(event);
          else console.log('Dastine method callback not set.');
          break;
        case 'InstallUpdate':
          if (Dastine.InstallUpdateCallBack)
            Dastine.InstallUpdateCallBack(event);
          else console.log('Dastine method callback not set.');
          break;
        case 'NIDGetFingerIndex':
          if (Dastine.NIDGetFingerIndexCallBack)
            Dastine.NIDGetFingerIndexCallBack(event);
          else console.log('Dastine method callback not set.');
          break;
        case 'NIDAuthenticateByPIN':
          if (Dastine.NIDAuthenticateByPINCallBack)
            Dastine.NIDAuthenticateByPINCallBack(event);
          else console.log('Dastine method callback not set.');
          break;
        case 'NIDAuthenticateByFingerUI':
          if (Dastine.NIDAuthenticateByFingerUICallBack)
            Dastine.NIDAuthenticateByFingerUICallBack(event);
          else console.log('Dastine method callback not set.');
          break;
        case 'NIDAuthenticateByFinger':
          if (Dastine.NIDAuthenticateByFingerCallBack)
            Dastine.NIDAuthenticateByFingerCallBack(event);
          else console.log('Dastine method callback not set.');
          break;
        case 'NIDSign':
          if (Dastine.NIDSignCallBack) Dastine.NIDSignCallBack(event);
          else console.log('Dastine method callback not set.');
          break;
        case 'NIDChangePIN':
          if (Dastine.NIDChangePINCallBack) Dastine.NIDChangePINCallBack(event);
          else console.log('Dastine method callback not set.');
          break;
        case 'NIDUnblockPIN':
          if (Dastine.NIDUnblockPINCallBack)
            Dastine.NIDUnblockPINCallBack(event);
          else console.log('Dastine method callback not set.');
          break;
        case 'NIDSetDSAuthToken':
          if (Dastine.NIDSetDSAuthTokenCallBack)
            Dastine.NIDSetDSAuthTokenCallBack(event);
          else console.log('Dastine method callback not set.');
          break;
        case 'TokenRemoveHandler':
          if (Dastine.TokenRemoveHandler) {
            if (event.data.Result == '0') {
              clearInterval(TokenRemovalTimer);
              RemovalEventRunning = false;
              Dastine.TokenRemoveHandler(event);
            }
          } else console.log('Dastine method callback not set.');
          break;
        case 'TokenInsertHandler':
          if (Dastine.TokenInsertHandler) {
            if (event.data.Result == '0') {
              clearInterval(TokenInsertionTimer);
              InsertionEventRunning = false;
              Dastine.TokenInsertHandler(event);
            }
          } else console.log('Dastine method callback not set.');
          break;
        default:
          console.log('No such function in Dastine!.');
      }
    }
  },
  DastineKeepAlive: function () {
    var msg = { command: 'DastineIsAlive' };
    msg['src'] = 'dastine.js';
    msg['info'] = Dastine.info;
    if (Dastine.socketConnection.readyState == 1) {
      Dastine.socketConnection.send(JSON.stringify(msg));
      setTimeout('Dastine.DastineKeepAlive()', 60000);
    }
  },
  isJSON: function (item) {
    item = typeof item !== 'string' ? JSON.stringify(item) : item;

    try {
      item = JSON.parse(item);
    } catch (e) {
      return false;
    }

    if (typeof item === 'object' && item !== null) {
      return true;
    }

    return false;
  },
  CheckResult: function (message, result) {
    if (Dastine.isJSON(result)) {
      var event = { src: 'background.js' };
      event['data'] = JSON.parse(result);
      return event;
    } else {
      var res = { command: message['command'] };
      res['Result'] = result;
      res['tab'] = message['tab'];
      var event = { src: 'background.js' };
      event['data'] = res;
      return event;
    }
  },
  CheckToken: function () {
    var msg = { command: 'TokenRemoveHandler' };
    msg['src'] = 'dastine.js';
    Dastine.TriggerDastineFunction(msg);
  },
  ListenForTokenRemovel: function () {
    TokenRemovalTimer = setInterval(function () {
      Dastine.CheckToken();
    }, TokenRemovalTimerWaitPeriod);
  },
  CheckToken1: function () {
    var msg = { command: 'TokenInsertHandler' };
    msg['src'] = 'dastine.js';
    Dastine.TriggerDastineFunction(msg);
  },
  ListenForTokenInsertion: function () {
    TokenInsertionTimer = setInterval(function () {
      Dastine.CheckToken1();
    }, TokenInsertionTimerWaitPeriod);
  },
};
var BrowserDetector = {
  init: function () {
    Dastine.jsStatus = document.readyState;
    this.browser = this.searchString(this.dataBrowser) || 'An unknown browser';
    this.version =
      this.searchVersion(navigator.userAgent) ||
      this.searchVersion(navigator.appVersion) ||
      'an unknown version';
    this.OS = this.searchString(this.dataOS) || 'an unknown OS';
    //this.OS ="Linux";
    var majorVersion = parseInt(BrowserDetector.version, 10);
    if (BrowserDetector.OS == 'Windows') {
      if (BrowserDetector.browser == 'Firefox' && majorVersion < 10)
        Dastine.errorMessage = 'DASTINE_BROWSER_NOT_SUPPORTED';
      else if (BrowserDetector.browser == 'Chrome' && majorVersion < 15)
        Dastine.errorMessage = 'DASTINE_BROWSER_NOT_SUPPORTED';
      else if (BrowserDetector.browser == 'Explorer' && majorVersion < 10)
        Dastine.errorMessage = 'DASTINE_BROWSER_NOT_SUPPORTED';
      else if (BrowserDetector.browser == 'Opera' && majorVersion < 12)
        Dastine.errorMessage = 'DASTINE_BROWSER_NOT_SUPPORTED';
      else if (BrowserDetector.browser == 'Mozilla' && majorVersion < 11)
        Dastine.errorMessage = 'DASTINE_BROWSER_NOT_SUPPORTED';
    }

    if (location.protocol == 'https:') {
      if (
        BrowserDetector.OS == 'Windows' ||
        dedicatedPortSSL === '' ||
        typeof dedicatedPortSSL === 'undefined'
      )
        hostUrl = 'wss://localhost.dastine.pki.co.ir:51357/dastine';
      else
        hostUrl =
          'wss://localhost.dastine.pki.co.ir:' + dedicatedPortSSL + '/dastine';
    } else {
      if (
        BrowserDetector.OS == 'Windows' ||
        dedicatedPort === '' ||
        typeof dedicatedPort === 'undefined'
      )
        hostUrl = 'ws://127.0.0.1:51356/dastine';
      else hostUrl = 'ws://127.0.0.1:' + dedicatedPort + '/dastine';
    }
    //DastineInstaller.createConnection();
    Dastine.jsStatus = document.readyState;
  },
  searchString: function (data) {
    for (var i = 0; i < data.length; i++) {
      var dataString = data[i].string;
      var dataProp = data[i].prop;
      this.versionSearchString = data[i].versionSearch || data[i].identity;
      if (dataString) {
        if (dataString.indexOf(data[i].subString) != -1)
          return data[i].identity;
      } else if (dataProp) return data[i].identity;
    }
  },
  searchVersion: function (dataString) {
    var index = dataString.indexOf(this.versionSearchString);
    if (index == -1) return;
    return parseFloat(
      dataString.substring(index + this.versionSearchString.length + 1)
    );
  },
  dataBrowser: [
    {
      string: navigator.userAgent,
      subString: 'Chrome',
      identity: 'Chrome',
    },
    {
      string: navigator.userAgent,
      subString: 'OmniWeb',
      versionSearch: 'OmniWeb/',
      identity: 'OmniWeb',
    },
    {
      string: navigator.vendor,
      subString: 'Apple',
      identity: 'Safari',
      versionSearch: 'Version',
    },
    {
      prop: window.opera,
      identity: 'Opera',
      versionSearch: 'Version',
    },
    {
      string: navigator.vendor,
      subString: 'iCab',
      identity: 'iCab',
    },
    {
      string: navigator.vendor,
      subString: 'KDE',
      identity: 'Konqueror',
    },
    {
      string: navigator.userAgent,
      subString: 'Firefox',
      identity: 'Firefox',
    },
    {
      string: navigator.vendor,
      subString: 'Camino',
      identity: 'Camino',
    },
    {
      // for newer Netscapes (6+)
      string: navigator.userAgent,
      subString: 'Netscape',
      identity: 'Netscape',
    },
    {
      string: navigator.userAgent,
      subString: 'MSIE',
      identity: 'Explorer',
      versionSearch: 'MSIE',
    },
    {
      string: navigator.userAgent,
      subString: 'Gecko',
      identity: 'Mozilla',
      versionSearch: 'rv',
    },
    {
      // for older Netscapes (4-)
      string: navigator.userAgent,
      subString: 'Mozilla',
      identity: 'Netscape',
      versionSearch: 'Mozilla',
    },
  ],
  dataOS: [
    {
      string: navigator.platform,
      subString: 'Win',
      identity: 'Windows',
    },
    {
      string: navigator.platform,
      subString: 'Mac',
      identity: 'Mac',
    },
    {
      string: navigator.userAgent,
      subString: 'iPhone',
      identity: 'iPhone/iPod',
    },
    {
      string: navigator.platform,
      subString: 'Linux',
      identity: 'Linux',
    },
    {
      string: navigator.platform,
      subString: 'Android',
      identity: 'Android',
    },
  ],
};
var DastineInstaller = {
  createConnection: function () {
    try {
      Dastine.socketStatus = 'opening';
      Dastine.errorMessage = 'WAITING_FOR_DASTINE_SERVICE';
      Dastine.jsStatus = document.readyState;
      if (typeof sessionStorage.DastineId == 'undefined') {
        var randomString = generateRandomString();
        sessionStorage.setItem('DastineId', randomString);
      }
      Dastine.info = sessionStorage.DastineId;
      Dastine.socketConnection = new WebSocket(hostUrl);
      //Dastine.socketConnection.onmessage = Dastine.TriggerDastineOutput;

      Dastine.socketConnection.onopen = function (e) {
        Dastine.socketConnection.onmessage = Dastine.TriggerDastineOutput;
        Dastine.jsStatus = document.readyState;
        console.log('Socket opened to: ' + hostUrl);
        //alert('Socket opened to: ' + hostUrl);
        Dastine.socketStatus = 'opened';
        Dastine.isInstalled = true;
        if (Dastine.socketConnection.readyState == 1) {
          Dastine.DastineKeepAlive();
          Dastine.SetConfig(
            DastineConfig.config +
              '<HostDownloadLink>' +
              DastineConfig.hostDownloadLink +
              '</HostDownloadLink>' +
              '<HostDownloadLinkAndroid>' +
              DastineConfig.hostDownloadLinkAndroid +
              '</HostDownloadLinkAndroid>',
            function (event) {
              Dastine.GetVersion(function (event) {
                Dastine.version = event.data.Result;
                if (BrowserDetector.OS == 'Windows') {
                  if (Dastine.version < DastineConfig.minVersion)
                    Dastine.errorMessage = 'DASTINE_VERSION_OUTDATED';
                } else {
                  if (Dastine.version < DastineConfig.minVersionAndroid)
                    Dastine.errorMessage = 'DASTINE_VERSION_OUTDATED';
                }
              });
            }
          );
        }
      };

      Dastine.socketConnection.onerror = function (error) {
        console.log('Socket failed to: ' + hostUrl);
        retriesNum++;
        if (retriesNum < socketAttemptCount) {
          //alert(retriesNum);
          setTimeout(function () {
            DastineInstaller.createConnection();
          }, 10000);
        }
        if (retriesNum >= socketAttemptCount && hostUrlAltered == false) {
          if (location.protocol == 'https:') {
            if (
              dedicatedPortSSL != '' &&
              !(typeof dedicatedPortSSL == 'undefined') &&
              !(BrowserDetector.OS == 'Windows')
            ) {
              hostUrl = 'wss://localhost.dastine.pki.co.ir:51357/dastine';
              //alert("host url changed to:"+ hostUrl) ;
              retriesNum = 0;
              hostUrlAltered = true;
              DastineInstaller.createConnection();
            }
          } else {
            if (
              dedicatedPort != '' &&
              !(typeof dedicatedPort == 'undefined') &&
              !(BrowserDetector.OS == 'Windows')
            ) {
              hostUrl = 'ws://127.0.0.1:51356/dastine';
              //alert("host url changed to:"+ hostUrl) ;
              retriesNum = 0;
              hostUrlAltered = true;
              DastineInstaller.createConnection();
            }
          }
        }
        if (retriesNum >= socketAttemptCount) {
          //alert("dastine not installed");
          Dastine.socketStatus = 'failed';
          Dastine.errorMessage = 'DASTINE_NOT_INSTALLED';
          Dastine.isInstalled = false;
          if (DastineConfig.debug == 1)
            Dastine.errorMessage =
              'DASTINE_NOT_INSTALLED\n' +
              BrowserDetector.OS +
              '\n' +
              BrowserDetector.browser +
              '\n' +
              hostUrl +
              '\n socket status:' +
              Dastine.socketStatus +
              '\nRetries number:' +
              retriesNum +
              '\n js status:' +
              Dastine.jsStatus +
              '\nError:' +
              error +
              '\nisinstalled:' +
              Dastine.isInstalled;
        }
        Dastine.jsStatus = document.readyState;
      };
      Dastine.socketConnection.onclose = function (event) {
        Dastine.jsStatus = document.readyState;
        Dastine.isInstalled = false;
        if (
          Dastine.socketStatus != 'failed' &&
          Dastine.socketStatus != 'opening'
        )
          Dastine.socketStatus = 'closed';
        var reason;
        if (event.code == 1000)
          reason =
            'Normal closure, meaning that the purpose for which the connection was established has been fulfilled.';
        else if (event.code == 1001)
          reason =
            'An endpoint is "going away", such as a server going down or a browser having navigated away from a page.';
        else if (event.code == 1002)
          reason =
            'An endpoint is terminating the connection due to a protocol error';
        else if (event.code == 1003)
          reason =
            'An endpoint is terminating the connection because it has received a type of data it cannot accept (e.g., an endpoint that understands only text data MAY send this if it receives a binary message).';
        else if (event.code == 1004)
          reason =
            'Reserved. The specific meaning might be defined in the future.';
        else if (event.code == 1005)
          reason = 'No status code was actually present.';
        else if (event.code == 1006)
          reason =
            'The connection was closed abnormally, e.g., without sending or receiving a Close control frame';
        else if (event.code == 1007)
          reason =
            'An endpoint is terminating the connection because it has received data within a message that was not consistent with the type of the message (e.g., non-UTF-8 [https://www.rfc-editor.org/rfc/rfc3629] data within a text message).';
        else if (event.code == 1008)
          reason =
            'An endpoint is terminating the connection because it has received a message that "violates its policy". This reason is given either if there is no other sutible reason, or if there is a need to hide specific details about the policy.';
        else if (event.code == 1009)
          reason =
            'An endpoint is terminating the connection because it has received a message that is too big for it to process.';
        else if (event.code == 1010)
          // Note that this status code is not used by the server, because it can fail the WebSocket handshake instead.
          reason =
            "An endpoint (client) is terminating the connection because it has expected the server to negotiate one or more extension, but the server didn't return them in the response message of the WebSocket handshake. <br /> Specifically, the extensions that are needed are: " +
            event.reason;
        else if (event.code == 1011)
          reason =
            'A server is terminating the connection because it encountered an unexpected condition that prevented it from fulfilling the request.';
        else if (event.code == 1015)
          reason =
            "The connection was closed due to a failure to perform a TLS handshake (e.g., the server certificate can't be verified).";
        else reason = 'Unknown reason';

        if (DastineConfig.debug == 1)
          Dastine.errorMessage =
            'DASTINE_NOT_INSTALLED\n' +
            BrowserDetector.OS +
            '\n' +
            BrowserDetector.browser +
            '\n' +
            hostUrl +
            '\n socket status:' +
            Dastine.socketStatus +
            '\nRetries number:' +
            retriesNum +
            '\n js status:' +
            Dastine.jsStatus +
            '\nisinstalled:' +
            Dastine.isInstalled +
            '\nsocket closed. reason:' +
            reason;
        else if (Dastine.socketStatus == 'opening')
          Dastine.errorMessage = 'WAITING_FOR_DASTINE_SERVICE';
        else if (Dastine.socketStatus == 'failed')
          Dastine.errorMessage = 'DASTINE_NOT_INSTALLED';
        else if (Dastine.socketStatus == 'closed')
          Dastine.errorMessage = 'DASTINE_SERVICE_IS_CLOSED';
      };
    } catch (e) {
      Dastine.jsStatus = document.readyState;
      Dastine.isInstalled = false;
      if (DastineConfig.debug == 1)
        Dastine.errorMessage =
          'DASTINE_NOT_INSTALLED\n' +
          BrowserDetector.OS +
          '\n' +
          BrowserDetector.browser +
          '\n' +
          hostUrl +
          '\n socket status:' +
          Dastine.socketStatus +
          '\nRetries number:' +
          retriesNum +
          '\n js status:' +
          Dastine.jsStatus +
          '\nError:' +
          e +
          '\nisinstalled:' +
          Dastine.isInstalled;
      else if (Dastine.socketStatus == 'opening')
        Dastine.errorMessage = 'WAITING_FOR_DASTINE_SERVICE';
      else if (Dastine.socketStatus == 'failed')
        Dastine.errorMessage = 'DASTINE_NOT_INSTALLED';
      else if (Dastine.socketStatus == 'closed')
        Dastine.errorMessage = 'DASTINE_SERVICE_IS_CLOSED';
      else Dastine.errorMessage = e;
    }
  },
};

function generateRandomString() {
  var text = '';
  var possible =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < 15; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

function DastineInitialize() {
  if (Dastine.socketStatus == 'opening') return 'DASTINE_IS_OPENING';
  if (Dastine.socketStatus == 'opened') return 'DASTINE_IS_OPEN';
  retriesNum = 0;
  hostUrlAltered = false;
  BrowserDetector.init();
  DastineInstaller.createConnection();
  return 0;
}

function DastineSetPort(portNumber, portNumberSSL) {
  if (Dastine.socketStatus == 'opening') return 'DASTINE_IS_OPENING';
  if (Dastine.socketStatus == 'opened') return 'DASTINE_IS_OPEN';
  dedicatedPort = portNumber;
  dedicatedPortSSL = portNumberSSL;
  return 0;
}
function utf16leToBase64(input) {
  var utf16leString = '';
  for (var i = 0; i < input.length; i++) {
    const charCode = input.charCodeAt(i);
    utf16leString += String.fromCharCode(
      charCode & 0xff,
      (charCode >> 8) & 0xff
    );
  }
  const base64String = btoa(utf16leString);
  return base64String;
}
function base64ToUtf16le(input) {
  const utf16leString = atob(input);
  var unicodeString = '';
  for (var i = 0; i < utf16leString.length; i += 2) {
    const lowByte = utf16leString.charCodeAt(i);
    const highByte = utf16leString.charCodeAt(i + 1);
    const charCode = lowByte + (highByte << 8);
    unicodeString += String.fromCharCode(charCode);
  }
  return unicodeString;
}
if (autoInitialize) DastineInitialize();
