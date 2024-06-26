# PikPix

A command-line tool to convert image formats with optional compression and metadata stripping, built with Node.js, Sharp and Commander.

## Features

- Convert single image files or bulk convert all images in a directory.
- Support for various image formats including JPEG, PNG, WebP, TIFF, etc.
- Optional compression to reduce file size.
- Option to strip metadata from images.

## Installation

### Global Installation

To install the tool globally, run:

```bash
npm install -g pikpix
```

### Local Installation for Development

Clone the repository and install dependencies:

```bash
git clone https://github.com/tcj9/pikpix.git
cd pikpix
npm install
```

## Usage

### Single File Conversion

To convert a single image file, use the following command:

```bash
pikpix --input <input_file> --output <output_file> --format <format> [--compression <level>] [--strip]
```

### Bulk Conversion (Directory)

To convert all images in a directory, use the following command:

```bash
pikpix --input <input_directory> --output <output_directory> --format <format> [--compression <level>] [--strip]
```

### Options

- `-i, --input <path>`: Input image file or directory.
- `-o, --output <path>`: Output image file or directory.
- `-f, --format <format>`: Output format (jpeg, png, webp, tiff, etc.).
- `-c, --compression <level>`: Compression level (0-100). Optional.
- `-s, --strip`: Strip metadata. Optional.

### Examples

#### Single File Conversion

Convert a single image from PNG to JPEG with compression level 80 and strip metadata:

```bash
pikpix --input image.png --output image.jpg --format jpg --compression 80 --strip
```

#### Bulk Conversion

Convert all WebP images in the `input_directory` to JPEG format with compression level 80 and strip metadata:

```bash
pikpix --input input_directory --output output_directory --format jpg --compression 80 --strip
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

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Issues

If you encounter any issues, please [open an issue](https://github.com/tcj9/pikpix/issues).

## Acknowledgements

- [Sharp](https://github.com/lovell/sharp) - The high-performance Node.js image processing library.
- [Commander](https://github.com/tj/commander.js) - The complete solution for Node.js command-line interfaces.
