using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FileManager.Domain.Enums.Signatures
{
    public enum CertificateValidationStatus:byte
    {
        CertificateValidationOK=0,
        PeriodValidationFailed=1,
        ChainValidationFailed=2,
        IntgrityValidationFailed=3,
        KeyUsageValidationFailed=4,
        OCSPValidationRevoked=5,
        OCSPValidationUnKnown=6,
        CRLValidationRevoked=7,
        CRLAndOCSPValidationError=8,
        OCSPValidationException=9,
        CRLValidationUnKnown=10,
        CRLAndOCSPValidationUnknown=11
    }

    public enum HashAlgorithm:byte
    {
        SHA1=0,
        SHA256=1,
        SHA384=2,
        SHA512=3,
    }

}
