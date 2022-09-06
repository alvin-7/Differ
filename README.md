# Getting Started with Diff APP

## Available Scripts

In the project directory, you can run:

### `yarn start`

Runs the app in the development mode.\
Open [http://localhost:9000](http://localhost:9000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `yarn test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `yarn package`

Maps to electronForge.package, will package your application into a platform specific format and put the result in a folder. Please note that this does not make a distributable format. To make proper distributables, please use the make command.

### `yarn make`

Maps to electronForge.make, will make distributables for your application based on your Forge config and the parameters you pass in.

### `yarn run publish`

Maps to electronForge.publish, will attempt to make the forge application and then publish it to the publish targets defined in your forge config.

## Usage

Differ.exe --excel /path/to/oldexcel --excel /path/to/newexcel
