using IdentityServer4.Services;
using Microsoft.AspNetCore.Mvc;

namespace IdentityServer.Controllers
{
    [ApiExplorerSettings(IgnoreApi = true)]
    public class HomeController : Controller
    {
        private readonly IIdentityServerInteractionService _interaction;

        public HomeController(IIdentityServerInteractionService interaction)
        {
            _interaction = interaction;
        }

        public IActionResult Index()
        {
            return RedirectToAction("Login", "Account");
        }

        /// <summary>
        /// Shows the error page
        /// </summary>
        public IActionResult Error(string errorId)
        {
            return View("Error");
        }
    }
}
