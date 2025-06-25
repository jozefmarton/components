﻿## j-RawInput

__j-RawInput__ is a simple input component with a big hidden functionality. It's targeted for additional customization.

- jComponent `v19|v20`

__Configuration__:

- `type {String}` optional, can be `email`, `phone`, `password`, `zip`, `date`, `time`, `url`, `number`, `search`, `lower`, `upper` or empty (default)
- `required {Boolean}` optional, enables "required" (default: `false`)
- `autofocus {Boolean}` optional, focuses the input (default: `false`)
- `autofill {Boolean}` optional, enables browser's autofill feature (default: `false`)
- `placeholder {String}` optional, adds a `placeholder` text into the input
- `maxlength {Number}` optional, sets a maximum length of chars (default: `200`)
- `minlength {Number}` optional, sets a minimum length of chars
- `minvalue {Number}` optional, a minimal value for `number` type
- `maxvalue {Number}` optional, a maximal value for `number` type
- `validate {String}` optional, a condition for validating of value, can contain a link to `function(value)` or `!!value.match(/[a-z]+/)`
- `format {String}` optional, output formatting e.g. for `date` type: `yyyy-MM-dd`, for `time` type: `HH:mm`, for `number` you can define max. decimals
- `disabled {Boolean}` optional, disables this component
- `autocomplete {String}` optional, needs to contain a link to a function, is triggered on `focus` event
- `spaces {Boolean}` optional, enables spaces otherwise it removes them (default: `true`)
- `autosource {String}` a path to `search` function in `autocomplete`, `function(search, render(arr))`
- `autovalue {String}` a property path for the value in `autosource`, default: `name`
- `autoexec {String}` a path method `function(item, next(value_to_input))`
- `forcevalidation {Boolean}` enables for force validation for `phone` and `email` (default: `true`)
- `monospace {Boolean}` enables `monospaced` font (default: `false`)
- `enter {String}` a link to `function(val, com)` - evaluated when the user presses enter
- __NEW__: `realtime {Boolean}` enables real-time binding (default: `true`)
- __NEW__: `exec {String}` a link to the `function(value, element)` which will be evaluated if the input is affected

### Author

- Peter Širka <petersirka@gmail.com>
- [License](https://www.totaljs.com/license/)
