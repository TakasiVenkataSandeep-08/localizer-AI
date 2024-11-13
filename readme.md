# Content Localizer CLI

[![NPM Version](https://img.shields.io/npm/v/content-localizer.svg)](https://www.npmjs.com/package/content-localizer)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/content-localizer.svg)](https://nodejs.org)

A powerful CLI tool for replicating and translating content across multiple locales. Perfect for projects requiring content localization, especially suited for VitePress and similar documentation frameworks.

## Features

- 📁 Replicate directory structures for multiple locales
- 🔄 Support for multiple file types (.md, .txt, etc.)
- 🎯 Preserve original file structure and formatting
- 🚀 Easy to use CLI interface
- ⚡️ Fast and efficient processing
- 📦 Perfect for VitePress projects

## Prerequisites

- Node.js >= 16.0.0
- npm or yarn package manager

## Installation

```bash
# Install globally
npm install -g content-localizer
```

## Usage

Basic command structure:

```bash
content-localizer --source [sourcePath] --locales [locale1,locale2] --fileTypes [fileType1,fileType2] --from [fromLocale]
```

### Required Options

- `--source`: Path to the source directory
- `--locales`: Comma-separated list of target locales (e.g., 'no,sw')
- `--fileTypes`: Comma-separated list of file extensions (e.g., '.md,.txt')

### Optional Options

- `--from`: Source locale type (defaults to 'en')

### Example

```bash
content-localizer --source src/en --locales no,sw --fileTypes .md,.txt --from en
```

## Directory Structure Example

Source structure:

```
en/
├── introduction.md
├── getting-started/
├── installation/
│   └── installation.txt
├── usage/
│   └── usage.md
└── settings/
    └── settings.md
```

After running the tool, it creates identical structures for each locale:

Norwegian (no):

```
no/
├── introduction.md
├── getting-started/
├── installation/
│   └── installation.txt
├── usage/
│   └── usage.md
└── settings/
    └── settings.md
```

Swahili (sw):

```
sw/
├── introduction.md
├── getting-started/
├── installation/
│   └── installation.txt
├── usage/
│   └── usage.md
└── settings/
    └── settings.md
```

## Use Cases

### VitePress Documentation

Perfect for setting up multi-language documentation:

1. Organize your English content in `src/en`
2. Run content-localizer to create locale-specific directories
3. Translate content for each locale
4. Configure VitePress to use the generated structure

### General Website Localization

Easily create locale-specific content structures for any web project:

1. Store your source content in a primary locale directory
2. Use content-localizer to replicate the structure
3. Translate content while maintaining the same organization

## Common Workflows

1. **Initial Setup**

   ```bash
   content-localizer --source docs/en --locales fr,es,de --fileTypes .md
   ```

2. **Adding New Languages**
   ```bash
   content-localizer --source docs/en --locales it,pt --fileTypes .md,.txt
   ```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- Create an issue for bug reports or feature requests
- Star the project if you find it useful
- Follow the author for updates

## Author

Takasi Venkata Sandeep

## Repository

[GitHub Repository](https://github.com/TakasiVenkataSandeep-08/content-localizer)
