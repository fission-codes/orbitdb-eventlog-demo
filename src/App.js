import React from 'react';

import compose from 'recompose/compose';

import withState from 'recompose/withState';
import withProps from 'recompose/withProps';
import withHandlers from 'recompose/withHandlers';

import lifecycle from 'recompose/lifecycle';
import branch from 'recompose/branch';
import renderComponent from 'recompose/renderComponent';

import IPFS from 'ipfs';
import OrbitDB from 'orbit-db';

import './App.css';

  // Create IPFS instance
const ipfs = new IPFS({
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
})

const ErrorState = () => <div>IPFS FAILED TO CONNECT</div>
const LoadingState = () => <div>Loading...</div>

const LabeledDiv = ({label, value}) => <div>
  <label>{label}:</label>
  {value}
</div>

const InputPure = ({onSubmit, setFieldValue, placeholderText}) => <form onSubmit={onSubmit}>
  <input
    type='text'
    placeholder={placeholderText}
    onChange={(e) => setFieldValue(e.target.value)}
  />
</form>

const NameInput = compose(
  withState('fieldValue', 'setFieldValue', ''),
  withProps({placeholderText: 'Database Name'}),
  withHandlers({
    onSubmit: ({setDbName, fieldValue}) => (event) => {
      event.preventDefault()
      event.stopPropagation()
      setDbName(fieldValue)
    },
  }),
)(InputPure);

const ShowLogPure = ({log}) => <div>
    {
      log.slice().reverse().map((e) => <div>{e.payload.value}</div>)
    }
  </div>

const ShowLog = compose(
  withState('log', 'setLog', []),
  withHandlers({
    queryAndUpdateLog: ({eventLog, setLog}) => () => {
      console.log('updating log')
      const result = eventLog.iterator({ limit: 5 }).collect()
      console.dir('with result:', {result})
      setLog(result)
    },
  }),
  lifecycle({
    componentWillMount() {
      console.log('WILLMOUNTLOG')
      const {eventLog, queryAndUpdateLog} = this.props
      // When the database is ready (ie. loaded), display results
      eventLog.events.on('ready', queryAndUpdateLog)
      // When database gets replicated with a peer, display results
      eventLog.events.on('replicated', () => console.log('TODO: replicated'))
      // When we update the database, display result
      eventLog.events.on('write', queryAndUpdateLog)

      eventLog.events.on('replicate.progress', () => console.log('TODO: replicate.progress'))

      // // Hook up to the load progress event and render the progress
      // let maxTotal = 0;
      // let loaded = 0;
      // eventLog.events.on('load.progress', (address, hash, entry, progress, total) => {
      //   loaded = loaded + 1
      //   maxTotal = Math.max.apply(null, [maxTotal, progress, 0])
      //   total = Math.max.apply(null, [progress, maxTotal, total, entry.clock.time, 0])
      //   console.log(`Loading database... ${maxTotal} / ${total}`)
      // })
      eventLog.load()
    }
  })
)(ShowLogPure);


const AddEventInput = compose(
  withState('fieldValue', 'setFieldValue', ''),
  withProps({placeholderText: 'Event to add'}),
  withHandlers({
    onSubmit: ({eventLog, fieldValue}) => (event) => {
      event.preventDefault()
      event.stopPropagation()
      console.dir('ADDDING VALUE', eventLog, fieldValue)
      eventLog.add(`ENTRY WITH VALUE: ${fieldValue}`)
    },
  })
)(InputPure)

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
      orbitdb.open(dbName, {
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
      }).then(db => {
        console.log('WHAT', {db})
        setEventLog(db)
      })
    },
  }),
  branch(({eventLog}) => !eventLog, renderComponent(LoadingState)),

)(EventLogStoreContainerPure)


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
    componentWillMount() {
      const {setDB, setError} = this.props;
      ipfs.on('error', (e) => {
        console.error(e)
        setError(true)
      })
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
