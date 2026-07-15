using SixLabors.Fonts;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Drawing.Processing;
using SixLabors.ImageSharp.Formats;
using SixLabors.ImageSharp.Formats.Jpeg;
using SixLabors.ImageSharp.PixelFormats;
using SixLabors.ImageSharp.Processing;
using System;
using System.IO;
using System.Linq;
using System.Text;

namespace CaptchaGen.NetCore
{
    /// <summary>
    /// Generates a captcha image based on the captcha code string given.
    /// </summary>
    public static class ImageFactory
    {
        /// <summary>Create a random string that consists of 'digitCount' characters</summary>
        public static string CreateCode(int digitCount = 5)
        {
            char[] chars = {'A','B','C','D','G','H','K','M','N','P','Q','R','S','T','W','X','Y',
                '3','4','5','6','8'};
            StringBuilder sb = new StringBuilder();
            Random random = new Random();
            for (int i = 0; i < digitCount; i++)
            {
                sb.Append(chars[random.Next(chars.Length)]);
            }
            return sb.ToString();
        }

        public static Color BackgroundColor { get; set; } = Color.Wheat;

        public static MemoryStream BuildImage(string captchaCode, int imageHeight, int imageWidth,
            int fontSize, int distortion = 18, IImageEncoder imgFormat = null)
        {
            int newX, newY;
            Random random = new Random();
            MemoryStream memoryStream = new MemoryStream();
            var font = ResolveFont(fontSize);

            using (var captchaImage = new Image<Rgba32>(imageWidth, imageHeight))
            using (var cache = new Image<Rgba32>(imageWidth, imageHeight))
            {
                captchaImage.Mutate(ctx =>
                {
                    ctx.Fill(Color.White);
                    ctx.DrawText(captchaCode, font, Color.Gray, new PointF(8, 8));

                    for (int i = 0; i < 8; i++)
                    {
                        int startX = random.Next(imageWidth);
                        int startY = random.Next(imageHeight);
                        int endX = random.Next(imageWidth);
                        int endY = random.Next(imageHeight);
                        ctx.DrawLine(Color.Gray, 1, new PointF(startX, startY), new PointF(endX, endY));
                    }
                });

                for (int y = 0; y < imageHeight; y++)
                {
                    for (int x = 0; x < imageWidth; x++)
                    {
                        newX = (int)(x + (distortion * Math.Sin(Math.PI * y / 64.0)));
                        newY = (int)(y + (distortion * Math.Cos(Math.PI * x / 64.0)));
                        if (newX < 0 || newX >= imageWidth) newX = 0;
                        if (newY < 0 || newY >= imageHeight) newY = 0;
                        cache[newX, newY] = captchaImage[x, y];
                    }
                }

                imgFormat ??= new JpegEncoder();
                cache.Save(memoryStream, imgFormat);
                memoryStream.Position = 0;
                return memoryStream;
            }
        }

        /// <summary>
        /// Linux Docker images often lack Tahoma — fall back to Liberation/DejaVu/Arial.
        /// </summary>
        private static Font ResolveFont(float fontSize)
        {
            string[] preferred =
            {
                "Liberation Sans",
                "DejaVu Sans",
                "FreeSans",
                "Noto Sans",
                "Arial",
                "Tahoma",
                "Verdana",
            };

            foreach (var name in preferred)
            {
                if (SystemFonts.TryGet(name, out var family))
                    return family.CreateFont(fontSize, FontStyle.Italic);
            }

            var first = SystemFonts.Collection.Families.FirstOrDefault();
            if (!string.IsNullOrWhiteSpace(first.Name))
                return first.CreateFont(fontSize, FontStyle.Italic);

            // Absolute last resort — may throw if no fonts exist at all
            return SystemFonts.CreateFont("Arial", fontSize, FontStyle.Italic);
        }
    }
}
