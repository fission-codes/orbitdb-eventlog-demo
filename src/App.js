import React from 'react';

import compose from 'recompose/compose';

import withState from 'recompose/withState';
import withHandlers from 'recompose/withHandlers';

import lifecycle from 'recompose/lifecycle';
import branch from 'recompose/branch';
import renderComponent from 'recompose/renderComponent';

import IPFS from 'ipfs';
import OrbitDB from 'orbit-db';

import './App.css';

/*
  ⚙️ SETTINGS
*/

const IPFS_SETTINGS = {
  repo: '/orbitdb/examples/browser/new/ipfs/0.33.1',
  start: true,
  preload: {
    enabled: false
  },
  EXPERIMENTAL: {
    pubsub: true,
  },
  config: {
    Addresses: {
      Swarm: [
        // Use IPFS dev signal server
        // '/dns4/star-signal.cloud.ipfs.team/wss/p2p-webrtc-star',
        '/dns4/ws-star.discovery.libp2p.io/tcp/443/wss/p2p-websocket-star',
        // Use local signal server
        // '/ip4/0.0.0.0/tcp/9090/wss/p2p-webrtc-star',
      ]
    },
  }
}

const LOCAL_DB_SETTINGS = {
  // If database doesn't exist, create it
  create: true,
  overwrite: true,
  // Load only the local version of the database,
  // don't load the latest from the network yet
  localOnly: false,
  type: 'eventlog',
  // If "Public" flag is set, allow anyone to write to the database,
  // otherwise only the creator of the database can write
  accessController: {
    write: ['*'],
  }
};

const REMOTE_DB_SETTINGS = {sync: true}

/*
  🛰 IPFS
*/

const ipfs = new IPFS(IPFS_SETTINGS)

/*
  🛠 UTIL COMPONENTS
*/

const ErrorState = () => <div>IPFS FAILED TO CONNECT</div>
const LoadingState = () => <div>Loading...</div>

const LabeledDiv = ({label, value}) => <div>
  <label>{label}:</label>
  {value}
</div>

const SimpleInputPure = ({onSubmit, setFieldValue, placeholderText, fieldValue}) => (
  <form onSubmit={onSubmit}>
    <input
      type='text'
      value={fieldValue}
      placeholder={placeholderText}
      onChange={(e) => setFieldValue(e.target.value)}
    />
  </form>);

const SimpleInput = compose(
  withState('fieldValue', 'setFieldValue', ''),
  withHandlers({
    onSubmit: ({onSubmit, fieldValue, setFieldValue}) => (event) => {
      event.preventDefault()
      event.stopPropagation()
      onSubmit(fieldValue)
      setFieldValue('')
    },
  }),
)(SimpleInputPure);

/*
  🎨 UI COMPONENTS
*/

const NameInput = ({setDbName}) => <SimpleInput onSubmit={setDbName} placeholderText='Database Name'/>
const AddEventInput = ({eventLog}) => <SimpleInput
  onSubmit={(fieldValue) => {
    console.dir('ADDDING VALUE', eventLog, fieldValue)
    eventLog.add(`ENTRY WITH VALUE: ${fieldValue}`)
  }}
  placeholderText='Event to add'
  />

/**
 * Show the contents of the Event log
 */
const ShowLogPure = ({log}) => <div>{log.slice().reverse().map((e) => <div>{e.payload.value}</div>)}</div>

const ShowLog = compose(
  withState('log', 'setLog', []),
  withHandlers({
    // A function meant for querying for new data in the open database
    queryAndUpdateLog: ({eventLog, setLog}) => () => {
      console.log('updating log')
      const result = eventLog
        .iterator({ limit: -1 })
        .collect()
      console.dir({result})
      setLog(result)
    },
  }),
  lifecycle({
    // Attach the eventlog event listeners and load the database
    componentWillMount() {
      const {eventLog, queryAndUpdateLog} = this.props
      // When the database is ready (ie. loaded), display results
      eventLog.events.on('ready', queryAndUpdateLog)

      // When database gets replicated with a peer, display results
      eventLog.events.on('replicated', queryAndUpdateLog)

      // When we update the database, display result
      eventLog.events.on('write', queryAndUpdateLog)

      // This can be used to know when peer information has changed
      eventLog.events.on('replicate.progress', () => console.log('TODO: replicate.progress'))

      // Hook up to the load progress event and render the progress
      let maxTotal = 0;
      let loaded = 0;
      eventLog.events.on('load.progress', (address, hash, entry, progress, total) => {
        loaded = loaded + 1
        maxTotal = Math.max.apply(null, [maxTotal, progress, 0])
        total = Math.max.apply(null, [progress, maxTotal, total, entry.clock.time, 0])
        console.log(`Loading database... ${maxTotal} / ${total}`)
      })
      eventLog.load()
    }
  })
)(ShowLogPure);

/*
  📦 CONTAINERS
*/

/**
 * Display the data for the given orbit db event log
 */
const EventLogStoreContainerPure = ({dbName, eventLog}) => (
  <div>
    <LabeledDiv label='DB name' value={dbName}/>
    <LabeledDiv label='DB address' value={eventLog.id}/>
    <ShowLog eventLog={eventLog} />
    <AddEventInput eventLog={eventLog} />
  </div>
);

const EventLogStoreContainer = compose(
  withState('dbName', 'setDbName', undefined),
  branch(({dbName}) => !dbName, renderComponent(NameInput)),
  withState('eventLog', 'setEventLog', undefined),
  lifecycle({
    componentWillMount() {
      const {setEventLog, orbitdb, dbName} = this.props;
      const connectionSettings = OrbitDB.isValidAddress(dbName)
        ? REMOTE_DB_SETTINGS
        : LOCAL_DB_SETTINGS;
      console.dir({connectionSettings})
      orbitdb
        .open(dbName, connectionSettings)
        .then(db => {
          console.log('WHAT', {db})
          setEventLog(db)
        })
    },
  }),
  branch(({eventLog}) => !eventLog, renderComponent(LoadingState)),

)(EventLogStoreContainerPure)

/**
 * Set up the UI for interacting with the OrbitDB instance
 */
const AppPure = ({orbitdb}) => (
  <div className="App">
    <LabeledDiv label='PEER ID' value={orbitdb.id}/>
    <EventLogStoreContainer orbitdb={orbitdb} />
  </div>
);

const App = compose(
  withState('orbitdb', 'setDB', undefined),
  withState('error', 'setError', false),
  lifecycle({
    // Set up IPFS event listeners
    componentWillMount() {
      const {setDB, setError} = this.props;

      ipfs.on('error', (e) => {
        console.error(e)
        setError(true)
      })

      // Create OrbitDB instance when IPFS is ready
      ipfs.on('ready', async () => {
        console.log("IPFS Started")
        const orbitdb = await OrbitDB.createInstance(ipfs)
        console.dir({orbitdb})
        setDB(orbitdb)
      })
    },
  }),
  branch(({error}) => error, renderComponent(ErrorState)),
  branch(({orbitdb}) => !orbitdb, renderComponent(LoadingState)),
)(AppPure)

export default App;
