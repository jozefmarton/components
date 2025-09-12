## j-Clipboard

- It works as singleton
- Uses `navigator.clipboard.writeText()` or `document.execCommand('copy')` as fallback

- jComponent `v19|v20`

__Methods__:

- `SETTER('clipboard/copy', 'TEXT TO CLIPBOARD')` or `FIND('clipboard').copy('TEXT TO CLIPBOARD')`

__Configuration__:

- `oncopy {String}` a link to the `function(value)`
- `native {Boolean}` enables native clipboard (default: `false`)

### Author

- Peter Širka <petersirka@gmail.com>
- [License](https://www.totaljs.com/license/)