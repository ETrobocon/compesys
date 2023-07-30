const noble = require('@abandonware/noble');
const sleep = (msec) => new Promise(resolve => setTimeout(resolve, msec));

// BLE peripheral GATT profile: XIAO side
const GATT_PROFILE = {
  'services': {
    'xiao': {
      'uuid': 'AD0C1000-64E9-48B0-9088-6F9E9FE4972E',
      'characteristics': {
        'command': {
          'uuid': 'AD0C1001-64E9-48B0-9088-6F9E9FE4972E',
          'isReadable': false,
          'isWritable': true,
          'isNotifiable': true,
          'packetLength': 21
        },
        'accelerometer': {
          'uuid': 'AD0C1002-64E9-48B0-9088-6F9E9FE4972E',
          'isReadable': true,
          'isWritable': false,
          'isNotifiable': true,
          'packetLength': 16
        },
        'gyroscope': {
          'uuid': 'AD0C1003-64E9-48B0-9088-6F9E9FE4972E',
          'isReadable': true,
          'isWritable': false,
          'isNotifiable': true,
          'packetLength': 16
        },
        'temperature': {
          'uuid': 'AD0C1004-64E9-48B0-9088-6F9E9FE4972E',
          'isReadable': true,
          'isWritable': false,
          'isNotifiable': true,
          'packetLength': 4
        },
        'led': {
          'uuid': 'AD0C1005-64E9-48B0-9088-6F9E9FE4972E',
          'isReadable': true,
          'isWritable': true,
          'isNotifiable': false,
          'packetLength': 1
        },
        'pwm': {
          'uuid': 'AD0C2001-64E9-48B0-9088-6F9E9FE4972E',
          'isReadable': true,
          'isWritable': true,
          'isNotifiable': false,
          'packetLength': 1
        },
        'voltage': {
          'uuid': 'AD0C2002-64E9-48B0-9088-6F9E9FE4972E',
          'isReadable': true,
          'isWritable': false,
          'isNotifiable': true,
          'packetLength': 8
        }
      }
    }
  }
}

noble.characteristics = GATT_PROFILE.services.xiao.characteristics;
noble.servicesDiscovered = false;
noble.inbox = {
  'accelerometer': {
    'timestamp': 0,
    'x': 0,
    'y': 0,
    'z': 0
  },
  'gyroscope': {
    'timestamp': 0,
    'x': 0,
    'y': 0,
    'z': 0
  },
  'temperature': {
    'timestamp': 0,
    'value': 0
  },
  'voltage': {
    'timestamp': 0,
    'value': 0
  },
  'pwm': {
    'timestamp': 0,
    'value': 0
  }
}

noble.on('stateChange', async (state) => {
  console.log('[noble]onStateChange: ' + state);
  if (state === 'poweredOn') {
    await noble.startScanningAsync();
  }
});

noble.on('scanStart', () => {
  console.log('[noble]Start scanning');
});

noble.on('scanStop', () => {
  console.log('[noble]Stop scanning');
});

noble.on('discover', async (peripheral) => {
  let localName = peripheral.advertisement.localName;
  if (localName && 
    (
      (process.env.MY_XIAO !== '' && process.env.MY_XIAO === localName) 
      || 
      (process.env.MY_XIAO === '' && localName.startsWith("XIAO"))
    )) {        
    await noble.stopScanningAsync();
    noble.servicesDiscovered = false;
    peripheral.connect();

    peripheral.once('connect', async function() {
      console.log('[noble]connected.');
      await this.discoverServicesAsync();
      await waitForDiscover();
      for (const key in noble.characteristics) {
        const characteristic = noble.characteristics[key];
        const instance = characteristic.instance;
        if (characteristic.isNotifiable) {
          console.log('[noble]subscribe: ' + key);
          await instance.subscribeAsync();
          instance.on('data', async (data, isNotification) => {
            //console.log(data);
            //console.log(isNotification);
            // let dv = new DataView(data.buffer);
            // noble.inbox[key].timestamp = dv.getUint32(0, true);
            // switch (key) {
            //   case 'accelerometer':
            //   case 'gyroscope':
            //     noble.inbox[key].x = dv.getFloat32(4, true);
            //     noble.inbox[key].y = dv.getFloat32(8, true);
            //     noble.inbox[key].z = dv.getFloat32(12, true);
            //     break;

            //   case 'temperature':
            //   case 'voltage':
            //     noble.inbox[key].value = dv.getFloat32(4, true);
            //     break;
            // }
          });
        }
      }
    });

    peripheral.once('disconnect', async function() {
      console.log('[noble]disconnected.');
      await noble.startScanningAsync();
    });

    peripheral.once('servicesDiscover', async (services) => {
      console.log('[noble]discovering services');
      for (i = 0; i < services.length; i++) {
        if (services[i].uuid.toUpperCase() === GATT_PROFILE.services.xiao.uuid.replace(/-/g, "")) {
          services[i].once('includedServicesDiscover', async function() {
            console.log('[noble]discovering includedServices');
            await this.discoverCharacteristicsAsync();
          });

          services[i].once('characteristicsDiscover', async (characteristics) => {
            console.log('[noble]discovering characteristics');
            for (j = 0; j < characteristics.length; j++) {
              for (const key in noble.characteristics) {
                if (characteristics[j].uuid.toUpperCase() === noble.characteristics[key].uuid.replace(/-/g, "")) {
                  noble.characteristics[key].instance = characteristics[j];
                }
              }
            }
            noble.servicesDiscovered = true;
          });

          await services[i].discoverIncludedServicesAsync();
        }
      }
    });
  }
});

async function waitForDiscover() {
  while (!noble.servicesDiscovered) {
    await sleep(100);
  }
}

module.exports = noble;