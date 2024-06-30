# PikPix

PikPix is a command-line tool to convert and optimize image formats with optional compression and resizing. It is built with Node.js, Sharp, and Commander, providing a powerful and flexible solution for image processing.

## Features

- **Image Conversion**: Supports various formats including `heic`, `heif`, `avif`, `jpeg`, `jpg`, `png`, `raw`, `tiff`, `tif`, `webp`, `gif`, `jp2`, `jpx`, `j2k`, `j2c`, and `svg`.
- **Compression Level**: Specify compression level (quality) for formats like `jpeg`, `jpg`, `png`, `webp`, `tiff`, `heif`, `heic`, and `avif`.
- **Resizing**: Resize images to specified dimensions without cropping.
- **Handling Local and Remote Images**: Input images from local file paths, URLs, and directories.
- **Directory Processing**: Process all images in a specified directory.
- **Unique Output File Names**: Ensures output file names are unique to avoid overwriting.
- **Optimization Options**: Various optimization features including flattening, sharpening, denoising, converting to grayscale, and applying blur.
- **Error Handling**: Comprehensive error handling with clear error messages.
- **Version Output**: Displays the current version of the tool.

## Installation

To install PikPix, use npm:

```bash
npm install -g pikpix
```

## Usage

```bash
pikpix -i <input> -o <output> -f <format> [options]
```

### Options

- `-v, --version`: Output the current version.
- `-i, --input <path>`: Input image file, URL, or directory.
- `-o, --output <path>`: Output image file or directory.
- `-f, --format <format>`: Output format (heic, heif, avif, jpeg, jpg, png, raw, tiff, tif, webp, gif, jp2, jpx, j2k, j2c, svg).
- `-c, --compression <level>`: Compression level (0-100).
- `-r, --resize <dimensions>`: Resize dimensions in format WIDTHxHEIGHT or WIDTHXHEIGHT.
- `--flatten [color]`: Flatten the image and fill the background with the specified color (default: white).
- `--sharpen`: Apply sharpening to the image.
- `--denoise`: Apply denoising to the image.
- `--grayscale`: Convert the image to grayscale.
- `--blur <sigma>`: Apply blur with the specified sigma value.

## Examples

### Convert a Single Image

```bash
pikpix -i input.jpg -o output.png -f png
```

### Convert and Compress an Image

```bash
pikpix -i input.jpg -o output.webp -f webp -c 80
```

### Resize an Image

```bash
pikpix -i input.jpg -o output.png -f png -r 800x600
```

### Optimize an Image

```bash
pikpix -i input.jpg -o output.png -f png --sharpen --grayscale
```

### Process a Directory of Images

```bash
pikpix -i ./input-directory -o ./output-directory -f webp -c 80
```

## Development

### Setup

Clone the repository and install dependencies:

```bash
git clone https://github.com/tcj9/pikpix.git
cd pikpix
npm install
```

### Test Locally

Link the package locally to test it:

```bash
npm link
```

You can now use the `pikpix` command from anywhere in your terminal.

### Unlink After Testing

To unlink the package after testing:

```bash
npm unlink
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Steps to Contribute

1. Fork the repository.
2. Create a new branch for your feature or bugfix.
3. Commit your changes.
4. Push the branch to your fork.
5. Submit a Pull Request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Author

[TCJ9](https://github.com/tcj9)

## Issues

If you encounter any issues, please [open an issue](https://github.com/tcj9/pikpix/issues).

## Acknowledgements

- [Sharp](https://github.com/lovell/sharp) - The high-performance Node.js image processing library.
- [Commander](https://github.com/tj/commander.js) - The complete solution for Node.js command-line interfaces.
- [Axios](https://github.com/axios/axios) - Promise based HTTP client for the browser and Node.js.
- [File-Type](https://github.com/sindresorhus/file-type) - Detect the file type of a Buffer/Uint8Array/ArrayBuffer.
