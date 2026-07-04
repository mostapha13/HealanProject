using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Share.Domain.Models
{
    public class CaptchaValidatorResponce
    {
        public bool Result { get; set; }
        public string ErrorMessage { get; set; }

    }
}
