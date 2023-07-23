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
  if (localName && localName.startsWith("XIAO")) {        
    console.log('[noble]discovered: ' + localName);
    await noble.stopScanningAsync();
    noble.servicesDiscovered = false;
    peripheral.connect();

    peripheral.on('connect', async function() {
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
            console.log('[' + key + ']data: ' + data.toString('hex'));
          });
        }
      }
    });

    peripheral.on('disconnect', async function() {
      console.log('[noble]disconnected.');
      await noble.startScanningAsync();
    });

    peripheral.on('servicesDiscover', async (services) => {
      console.log('[noble]discovering services');
      for (i = 0; i < services.length; i++) {
        services[i].on('includedServicesDiscover', async function() {
          await this.discoverCharacteristicsAsync();
        });

        services[i].on('characteristicsDiscover', async (characteristics) => {
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
    });
  }
});

async function waitForDiscover() {
  while (!noble.servicesDiscovered) {
    await sleep(100);
  }
}

module.exports = noble;