## j-ListForm

- jComponent `v19|v20`

__Configuration__:

- `autofocus {String/Boolean}` focuses the first input element, `string` means a custom selector (default: `false`)
- `empty {String}` empty list text (default: `---`)
- `default {Boolean}` performs `DEFAULT()` method for the form scope (default: `true`)
- `required {Boolean}` controll will be "required" (default: `false`)
- `enter {Boolean}` allows to use `enter` as submit (default: `false`)
- `disabled {Boolean}` disables the control (default: `false`)
- `formclass {String}` a custom class for form container
- `itemclass {String}` a custom class for item container
- `create {String}` a link to a function `function(empty_object, callback(DEFAULT_ITEM_OBJECT), arr)` (`null` value skips creating)
- `submit {String}` a link to a function `function(form_data, callback(NEW_DATA), arr, item_ref_in_items)` (`null` value skips updating)
- `update {String}` a link to a function `function(form_data, callback(NEW_DATA), arr, item_ref_in_items)` (`null` value skips updating)
- `remove {String}` a link to a function `function(remove_item, callback(really_remove?), arr)`
- `selector {String}` a jQuery selector for custom template (outside of the component). Works like `custom template` in [data-binding](https://wiki.totaljs.com/jcomponent/08-data-binding/)
- `footertop {Boolean}` moves the footer on the top of the component (default: `false`)
- `move {String}` a link to a function `function(items)`
- `newbie {String}` a property name for every new item (it will always contain `true` value)
- `plugin {String}` a custom plugin name inside the component (default: `component.ID`)
- `invalidform {Boolean}` disables `j-Validate` component if the `j-ListForm` is in editing mode (default: `false`)
- __NEW__: `delay {Number}` initial delay for displaying detail (default: `1000` ms)

The component needs to have defined 3 templates wrapped in `<script type="text/html">`:

- `1` first - with a Tangular template for rendering of item
- `2` second - a form with components (the form will be wrapped in isolated scope)
- `3` footer - a footer with button for `create` item

__Good to know:__

The component watches a click event on all buttons with `name` attribute:

- `name="submit"` performs submit/save of data to the model
- `name="update"` performs submit/save of data to the model
- `name="remove"` removes the current item from the model
- `name="cancel"` cancels editing
- `name="create"` creates an empty form
- `form` contains `ui-listform-new` class when creating a new item

__Listing buttons:__

- `name="remove"` removes item
- `name="up"` moves item to up
- `name="down"` moves item to down

__Methods:__

- __NEW__: `component.add()` opens a form for creating record

### Author

- Peter Širka <petersirka@gmail.com>
- [License](https://www.totaljs.com/license/)
