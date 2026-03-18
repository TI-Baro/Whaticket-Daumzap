# React WhatsMarked

React WhatsMarked is a React component that renders Markdown content using the `marked` library with custom rendering options.

## Installation

To install the component, use npm or yarn:

```bash
npm install react-whatsmarked
```

or

```bash
yarn add react-whatsmarked
```

## Usage

### Basic Usage

To use the `WhatsMarked` component in your React project, import it and pass the Markdown content as children:

```javascript
import React from 'react';
import WhatsMarked from 'react-whatsmarked';

const App = () => {
  const markdownContent = `
# Hello World
This is a **bold** text and this is an *italic* text.
`;

  return (
    <div>
      <WhatsMarked>{markdownContent}</WhatsMarked>
    </div>
  );
};

export default App;
```

### Usage with `oneline` Parameter

The `oneline` parameter allows you to render the Markdown content as a single line:

```javascript
import React from 'react';
import WhatsMarked from 'react-whatsmarked';

const App = () => {
  const markdownContent =
    "This is a **bold** text and this is an *italic* text.";

  return (
    <div>
      <WhatsMarked oneline>{markdownContent}</WhatsMarked>
    </div>
  );
};

export default App;
```

### Customizing CSS

You can import your own CSS file and send the classname to the component:

```
import React from 'react';
import WhatsMarked from 'react-whatsmarked';
import './custom.css';

const App = () => {
  const markdownContent = `
  # Hello World
  This is a **bold** text and this is an *italic* text.
  `;

  return (
    <div>
      <WhatsMarked className="customClassname">{markdownContent}</WhatsMarked>
    </div>
  );
};

export default App;
```

You can format your custom class using the [src/react-whatsmarked.css](src/react-whatsmarked.css) as an example.

Donations
---------

For being part of open source projects and documenting my work here I really do not charge anything.

If you think that any information and code you obtained here is worth of some money and are willing to donate, feel free to send any amount through PayPal or Bitcoin.

| Paypal | PIX (Brazil) |
| ------ | ------------ |
| [![](https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=X6XHVCPMRQEL4) | ![image](https://github.com/ticketz-oss/ticketz/assets/6070736/8e85b263-73ca-4fb4-9bdc-03fff356b6ff) <br> PIX Key: 0699c69d-0951-4686-a5b7-c6cd21aa7e15 |

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
