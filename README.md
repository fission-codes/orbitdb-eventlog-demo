_This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app)._
# OrbitDB Demo App
This intent of this app was to show how easy it was to create a shared eventlog between two remote nodes using orbit db.

## To run
1. In your terminal run `yarn start`
2. In chrome open http://localhost:3000
3. Type in the database name `test`
4. Copy the db address given
5. Open firefox to http://localhost:3000
6. Use the DB address from step 4 as the DB name

Now as you add new entries in either browser you should see the data sync to the other.

## Findings
Overall OrbitDB was pleasant to work with as an alpha projects

### Pros
1. Payloads easily encrypted
2. Useful helpers for creating and loading snapshots
3. Useful helpers for syncing with remote peers
4. Extending and Creating new types of stores is a first class usecase. Useful if we want to have aggregate events or if we'd like to encrpyt more of the event itself.
5. No real difference in use between single and multi user streams

### Things to be aware of
1. Using without IPFS pubsub degrades use as you would have to start polling for changes and remote peer updates would be hard if not impossible to track.
2. Changing permissions of a database requires duplicating the database and distrbuting the new address. (i.e. its locked in at time of creation)


## Available Scripts

In the project directory, you can run:

### `yarn start`

Runs the app in the development mode.<br />
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br />
You will also see any lint errors in the console.

### `yarn test`

Launches the test runner in the interactive watch mode.<br />
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `yarn build`

Builds the app for production to the `build` folder.<br />
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br />
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `yarn eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (Webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: https://facebook.github.io/create-react-app/docs/code-splitting

### Analyzing the Bundle Size

This section has moved here: https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size

### Making a Progressive Web App

This section has moved here: https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app

### Advanced Configuration

This section has moved here: https://facebook.github.io/create-react-app/docs/advanced-configuration

### Deployment

This section has moved here: https://facebook.github.io/create-react-app/docs/deployment

### `yarn build` fails to minify

This section has moved here: https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify
