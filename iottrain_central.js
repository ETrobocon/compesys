const noble = require("@abandonware/noble");
const { logger } = require("./logger.js");
const loggerChild = logger.child({ domain: "iottrain_central" });

const sleep = (msec) => new Promise((resolve) => setTimeout(resolve, msec));

// BLE peripheral GATT profile: XIAO side
const GATT_PROFILE = {
  services: {
    xiao: {
      uuid: "AD0C1000-64E9-48B0-9088-6F9E9FE4972E",
      characteristics: {
        command: {
          uuid: "AD0C1001-64E9-48B0-9088-6F9E9FE4972E",
          isReadable: false,
          isWritable: true,
          isNotifiable: true,
          packetLength: 21,
        },
        accelerometer: {
          uuid: "AD0C1002-64E9-48B0-9088-6F9E9FE4972E",
          isReadable: true,
          isWritable: false,
          isNotifiable: true,
          packetLength: 16,
        },
        gyroscope: {
          uuid: "AD0C1003-64E9-48B0-9088-6F9E9FE4972E",
          isReadable: true,
          isWritable: false,
          isNotifiable: true,
          packetLength: 16,
        },
        temperature: {
          uuid: "AD0C1004-64E9-48B0-9088-6F9E9FE4972E",
          isReadable: true,
          isWritable: false,
          isNotifiable: true,
          packetLength: 4,
        },
        led: {
          uuid: "AD0C1005-64E9-48B0-9088-6F9E9FE4972E",
          isReadable: true,
          isWritable: true,
          isNotifiable: false,
          packetLength: 1,
        },
        pwm: {
          uuid: "AD0C2001-64E9-48B0-9088-6F9E9FE4972E",
          isReadable: true,
          isWritable: true,
          isNotifiable: false,
          packetLength: 1,
        },
        voltage: {
          uuid: "AD0C2002-64E9-48B0-9088-6F9E9FE4972E",
          isReadable: true,
          isWritable: false,
          isNotifiable: true,
          packetLength: 8,
        },
      },
    },
  },
};

noble.characteristics = GATT_PROFILE.services.xiao.characteristics;
noble.servicesDiscovered = false;
noble.inbox = {
  accelerometer: {
    timestamp: null,
    x: null,
    y: null,
    z: null,
  },
  gyroscope: {
    timestamp: null,
    x: null,
    y: null,
    z: null,
  },
  temperature: {
    timestamp: 0,
    value: 0,
  },
  voltage: {
    timestamp: null,
    value: null,
  },
  pwm: {
    timestamp: 0,
    value: 0,
  },
};
noble.connected = false;
noble.timer = {
  accelerometer: 50,
  gyroscope: 50,
  voltage: 5000,
};

noble.on("stateChange", async (state) => {
  loggerChild.info("[noble]onStateChange: " + state);
  if (state === "poweredOn") {
    await noble.startScanningAsync();
  }
});

noble.on("scanStart", () => {
  loggerChild.info("[noble]Start scanning");
});

noble.on("scanStop", () => {
  loggerChild.info("[noble]Stop scanning");
});

noble.on("discover", async (peripheral) => {
  let localName = peripheral.advertisement.localName;
  if (
    localName &&
    ((process.env.MY_XIAO !== "" && process.env.MY_XIAO === localName) ||
      (process.env.MY_XIAO === "" && localName.startsWith("XIAO")))
  ) {
    loggerChild.info("[noble]discovered: " + localName);
    await noble.stopScanningAsync();
    noble.servicesDiscovered = false;
    peripheral.connect();

    peripheral.once("connect", async function () {
      noble.connected = true;
      loggerChild.info("[noble]connected.");
      await this.discoverServicesAsync();
      await waitForDiscover();
      loop();
    });

    peripheral.once("disconnect", async () => {
      noble.connected = false;
      loggerChild.info("[noble]disconnected.");
      await noble.startScanningAsync();
    });

    peripheral.once("servicesDiscover", async (services) => {
      loggerChild.info("[noble]discovering services");
      for (i = 0; i < services.length; i++) {
        if (
          services[i].uuid.toUpperCase() ===
          GATT_PROFILE.services.xiao.uuid.replace(/-/g, "")
        ) {
          services[i].once("includedServicesDiscover", async function () {
            loggerChild.info("[noble]discovering includedServices");
            await this.discoverCharacteristicsAsync();
          });

          services[i].once(
            "characteristicsDiscover",
            async (characteristics) => {
              loggerChild.info("[noble]discovering characteristics");
              for (j = 0; j < characteristics.length; j++) {
                for (const key in noble.characteristics) {
                  if (
                    characteristics[j].uuid.toUpperCase() ===
                    noble.characteristics[key].uuid.replace(/-/g, "")
                  ) {
                    noble.characteristics[key].instance = characteristics[j];
                  }
                }
              }
              noble.servicesDiscovered = true;
            }
          );

          await services[i].discoverIncludedServicesAsync();
        }
      }
    });
  }
});

const waitForDiscover = async () => {
  while (!noble.servicesDiscovered) {
    await sleep(100);
  }
}

const loop = async () => {
  let accTimer = 0;
  let gyroTimer = 0;
  let voltageTimer = 0;
  while (true) {
    if (!noble.connected) {
      break;
    }
    if (accTimer > noble.timer.accelerometer) {
      await getAccelerometer();
      accTimer = 0;
    }
    if (gyroTimer > noble.timer.gyroscope) {
      await getGyroscope();
      gyroTimer = 0;
    }
    if (voltageTimer > noble.timer.voltage) {
      await getVoltage();
      voltageTimer = 0;
    }
    await sleep(10);
    accTimer += 10;
    gyroTimer += 10;
    voltageTimer += 10;
  }
};

/**
 * Get accelerometer for iot train
 * @returns 
 */
const getAccelerometer = () => {
  return new Promise((resolve, reject) => {
    noble.characteristics["accelerometer"].instance.read((error, data) => {
      if (error !== null) {
        return reject(error);
      }
      return resolve(data);
    });
  })
    .then((data) => {
      noble.inbox["accelerometer"].timestamp = data.readFloatLE(0);
      noble.inbox["accelerometer"].x = data.readFloatLE(4);
      noble.inbox["accelerometer"].y = data.readFloatLE(8);
      noble.inbox["accelerometer"].z = data.readFloatLE(12);
      return;
    })
    .catch((error) => {
      loggerChild.error(error);
      noble.inbox["accelerometer"].timestamp = null;
      noble.inbox["accelerometer"].x = null;
      noble.inbox["accelerometer"].y = null;
      noble.inbox["accelerometer"].z = null;
      return;
    });
};

/**
 * Get gyro for iot train
 * @returns 
 */
const getGyroscope = () => {
  return new Promise((resolve, reject) => {
    noble.characteristics["gyroscope"].instance.read((error, data) => {
      if (error !== null) {
        return reject(error);
      }
      return resolve(data);
    });
  })
    .then((data) => {
      noble.inbox["gyroscope"].timestamp = data.readFloatLE(0);
      noble.inbox["gyroscope"].x = data.readFloatLE(4);
      noble.inbox["gyroscope"].y = data.readFloatLE(8);
      noble.inbox["gyroscope"].z = data.readFloatLE(12);
      return;
    })
    .catch((error) => {
      loggerChild.error(error);
      noble.inbox["gyroscope"].timestamp = null;
      noble.inbox["gyroscope"].x = null;
      noble.inbox["gyroscope"].y = null;
      noble.inbox["gyroscope"].z = null;
      return;
    });
};

/**
 * Get voltage for iot train
 * @returns 
 */
const getVoltage = () => {
  return new Promise((resolve, reject) => {
    noble.characteristics["voltage"].instance.read((error, data) => {
      if (error !== null) {
        return reject(error);
      }
      return resolve(data);
    });
  })
    .then((data) => {
      if (data.readFloatLE(4) !== 0) {
        noble.inbox["voltage"].timestamp = data.readFloatLE(0);
        noble.inbox["voltage"].value = data.readFloatLE(4);
        if (
          noble.inbox["voltage"].value <= 1.2 &&
          noble.inbox["voltage"].value > 0
        ) {
          loggerChild.warn(
            "battery voltage is low!! :" + noble.inbox["voltage"].value + "V"
          );
        }
      }
      return;
    })
    .catch((error) => {
      loggerChild.error(error);
      noble.inbox["voltage"].timestamp = null;
      noble.inbox["voltage"].value = null;
      return;
    });
};

module.exports = noble;
