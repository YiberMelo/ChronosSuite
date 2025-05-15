
using ImageMagick;

namespace OntimerSuite.Tools
{
    public class ImageManager
    {

        public string? GetImageType(string base64Image)
        {
            if (string.IsNullOrEmpty(base64Image))
                return null;

            if (base64Image.StartsWith("data:image/"))
            {
                int startIndex = "data:image/".Length;
                int endIndex = base64Image.IndexOf(";", startIndex);

                if (endIndex != -1)
                {
                    return base64Image.Substring(startIndex, endIndex - startIndex);
                }
            }
            return null;
        }

        public byte[]? ProcessImage(string base64Image)
        {
            if (string.IsNullOrEmpty(base64Image))
                return null;

            try
            {

                string cleanBase64 = base64Image;
                if (base64Image.StartsWith("data:image/"))
                {
                    var base64Index = base64Image.IndexOf("base64,") + "base64,".Length;
                    cleanBase64 = base64Image.Substring(base64Index);
                }

                var logoBytes = Convert.FromBase64String(cleanBase64);

                using (var originalStream = new MemoryStream(logoBytes))
                using (var image = new MagickImage(originalStream))
                {
                    using (var resizedStream = ResizeAndCompressImage(image, 500, 500, 90))
                    {
                        return resizedStream.ToArray();
                    }
                }
            }
            catch
            {
                return null;
            }
        }

        public bool IsBase64String(string base64)
        {
            Span<byte> buffer = new Span<byte>(new byte[base64.Length]);
            return Convert.TryFromBase64String(base64, buffer, out _);
        }

        public MemoryStream ResizeAndCompressImage(MagickImage image, uint width, uint height, uint quality)
        {
            var resizedStream = new MemoryStream();

            image.Resize(width, height);
            image.Quality = quality;
            image.Write(resizedStream);

            resizedStream.Position = 0;
            return resizedStream;
        }

        public string? ConvertImageToBase64(byte[]? imageBytes)
        {
            if (imageBytes == null || imageBytes.Length == 0)
                return null;

            try
            {
                return Convert.ToBase64String(imageBytes);
            }
            catch
            {
                return null;
            }
        }
    }
}
