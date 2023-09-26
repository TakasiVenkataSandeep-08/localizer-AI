# content-localizer CLI Documentation

## Description

The `content-localizer` CLI tool is designed for replicating files and folders from a source directory to multiple locales. It simplifies content translation and localization processes for multi-locale projects. This tool can be particularly useful for translating pages in projects like VitePress.

## Installation

You can install the `content-localizer` CLI tool via npm:

```bash
npm install -g content-localizer

```

## Usage

After installing the content-localizer CLI tool, you can run it from the command line as follows:

```bash
content-localizer --source [sourcePath] --locales [locale1,locale2] --fileTypes [fileType1,fileType2] --from [fromLocale]

```

## Options:

- --source (\*required) : Specify the path to the source directory.
- --locales (\*required) : Provide a comma-separated list of target locales.
- --fileTypes (\*required) : Specify a comma-separated list of the file types you want to replicate (e.g., '.md' for Markdown files, '.md,.txt' for Markdown and text files).
- --from (optional) : Specify the locale type of the file content at specified path (defaulted to en).

## Example:

```bash
content-localizer --source src/en --locales no,sw --fileTypes .md,.txt --from en

```

This command will replicate the specified file type from the 'en' source directory to the 'no' and 'sw' locales.

Let's say you have a source directory structure like this:

```md
    en/
    - introduction.md
    - getting-started/
    - installation/
        - installation.txt
    - usage/
        - usage.md
    - configuration/
    - settings/
        - settings.md
```

Running the replicateLocales function as shown in the usage example will replicate the Markdown files within the source directory to the specified locales. The resulting directory structure for each locale will be as follows:

For the 'no' locale:

```md
    no/
    - introduction.md
    - getting-started/
    - installation/
        - installation.txt
    - usage/
        - usage.md
    - configuration/
    - settings/
        - settings.md
```

For the 'sw' locale:

```md
    sw/
    - introduction.md
    - getting-started/
    - installation/
        - installation.txt
    - usage/
        - usage.md
    - configuration/
    - settings/
        - settings.md
```

## License

The content-localizer CLI tool is released under the [MIT License]("https://opensource.org/licenses/MIT").
