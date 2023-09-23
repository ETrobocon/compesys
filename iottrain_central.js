const noble = require("@abandonware/noble");
const { logger } = require("./logger.js");
const e = require("express");
const loggerChild = logger.child({ domain: "iottrain_central" });

const sleep = (msec) => new Promise((resolve) => setTimeout(resolve, msec));

var AsyncLock = require('async-lock');
var lock = new AsyncLock({timeout:5000});


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
        version: {
          uuid: "AD0C2003-64E9-48B0-9088-6F9E9FE4972E",
          isReadable: true,
          isWritable: false,
          isNotifiable: true,
          packetLength: 4,
        },
      },
    },
    mabeee: {
      uuid: "B9F5FF00-D813-46C6-8B61-B453EE2C74D9",
      characteristics: {
        1000: {
          uuid: "B9F51000-D813-46C6-8B61-B453EE2C74D9",
          isReadable: true,
          isWritable: true,
          isNotifiable: false,
          packetLength: 4,
        },
        voltage: {
          uuid: "B9F51001-D813-46C6-8B61-B453EE2C74D9",
          isReadable: false,
          isWritable: true,
          isNotifiable: true,
          packetLength: 1,
        },
        1002: {
          uuid: "B9F51002-D813-46C6-8B61-B453EE2C74D9",
          isReadable: false,
          isWritable: false,
          isNotifiable: true,
          packetLength: 1,
        },
        3005: {
          uuid: "B9F53005-D813-46C6-8B61-B453EE2C74D9",
          isReadable: true,
          isWritable: true,
          isNotifiable: false,
          packetLength: 5,
        },
        pwm: {
          uuid: "B9F53006-D813-46C6-8B61-B453EE2C74D9",
          isReadable: true,
          isWritable: true,
          isNotifiable: false,
          packetLength: 5,
        },
        name: {
          uuid: "B9F54001-D813-46C6-8B61-B453EE2C74D9",
          isReadable: true,
          isWritable: true,
          isNotifiable: false,
          packetLength: 12,
        },
        id: {
          uuid: "B9F54002-D813-46C6-8B61-B453EE2C74D9",
          isReadable: true,
          isWritable: false,
          isNotifiable: false,
          packetLength: 8,
        },
        version: {
          uuid: "B9F54003-D813-46C6-8B61-B453EE2C74D9",
          isReadable: true,
          isWritable: false,
          isNotifiable: false,
          packetLength: 4,
        },
        4004: {
          uuid: "B9F54004-D813-46C6-8B61-B453EE2C74D9",
          isReadable: false,
          isWritable: true,
          isNotifiable: false,
          packetLength: 1,
        },
      },
    },
  },
};

noble.xiao = {
  characteristics: GATT_PROFILE.services.xiao.characteristics,
  servicesDiscovered: false,
  connected: false,
}

noble.mabeee = {
  characteristics: GATT_PROFILE.services.mabeee.characteristics,
  servicesDiscovered: false,
  connected: false,
}

noble.inbox = {
  xiao: {
    name: null,
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
    version: null,
  },
  mabeee: {
    name: null,
    voltage: {
      timestamp: null,
      value: null,
    },
    pwm: {
      timestamp: 0,
      value: 0,
      targetValue: 0,
    },
  } 
};
noble.timer = {
  accelerometer: 50,
  gyroscope: 50,
  voltage: 5000,
  version: 100000,
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
  if (localName === undefined) {
    return;
  }

  if (
    (process.env.MY_XIAO !== "" && process.env.MY_XIAO === localName) ||
    (process.env.MY_XIAO === "" && localName.startsWith("XIAO"))  
  ) {
    loggerChild.info("[noble]discovered: " + localName);
    await noble.stopScanningAsync();
    noble.xiao.servicesDiscovered = false;
  } else if (
    (process.env.MY_MABEEE !== "" && process.env.MY_MABEEE === localName) ||
    (process.env.MY_MABEEE === "" && localName.startsWith("MaBeee"))
  ) {
    loggerChild.info("[noble]discovered: " + localName);
    await noble.stopScanningAsync();
    noble.mabeee.servicesDiscovered = false;
  } else {
    return;
  }
    
  peripheral.connect();

  peripheral.once("connect", async function () {
    if (localName.startsWith("XIAO")) {
      noble.xiao.connected = true;
      noble.inbox.xiao.name = localName;
      loggerChild.info("[noble]connected: " + localName);
      await this.discoverServicesAsync();
      while (!noble.xiao.servicesDiscovered) {
        await sleep(100);
      }
      if (!noble.mabeee.connected) {
        noble.startScanningAsync();
      }
      await fetchVersion();
      loopForXiao();
    } else if (localName.startsWith("MaBeee")) {
      noble.mabeee.connected = true;
      noble.inbox.mabeee.name = localName;
      loggerChild.info("[noble]connected: " + localName);
      await this.discoverServicesAsync();
      while (!noble.mabeee.servicesDiscovered) {
        await sleep(100);
      }

      for (const key in noble.mabeee.characteristics) {
        const characteristic = noble.mabeee.characteristics[key];
        const instance = characteristic.instance;
        if (characteristic.isNotifiable) {
          if (key === 'voltage') {
            loggerChild.info('[noble]subscribe: ' + key);        
            await instance.subscribeAsync();
            //loggerChild.info('wait [noble]subscribe: ' + key);        
              await sleep(100);
              instance.on('data', async (data, isNotification) => {
              noble.inbox.mabeee["voltage"].value = data.readUInt8(0) * Math.sqrt(2) / 100.0;
              if (
                noble.inbox.mabeee["voltage"].value <= 1.2 &&
                noble.inbox.mabeee["voltage"].value > 0
              ) {
                loggerChild.warn(
                  "battery voltage is low!! :" + noble.inbox.mabeee["voltage"].value + "V"
                );
              }
            });
          }
        }
      }

      if (!noble.xiao.connected) {
        noble.startScanningAsync();
      }
      await setPwm(noble.inbox.mabeee.pwm.targetValue);
      loopForMabeee();
    } else {
      return;
    }
  });

  peripheral.once("disconnect", async () => {
    if (localName.startsWith("XIAO")) {
      noble.xiao.connected = false;
      noble.inbox.xiao.name = null;
    } else if (localName.startsWith("MaBeee")) {
      noble.mabeee.connected = false;
      noble.inbox.mabeee.name = null;
    } else {
      return;
    }
    loggerChild.info("[noble]disconnected: " + localName);
    await noble.startScanningAsync();
  });

  peripheral.once("servicesDiscover", async (services) => {
    loggerChild.info("[noble]discovering services: " + localName);
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
              for (const key in noble.xiao.characteristics) {
                if (
                  characteristics[j].uuid.toUpperCase() ===
                  noble.xiao.characteristics[key].uuid.replace(/-/g, "")
                ) {
                  noble.xiao.characteristics[key].instance = characteristics[j];
                }
              }
            }
            noble.xiao.servicesDiscovered = true;
          }
        );

        await services[i].discoverIncludedServicesAsync();
      }
      else if (
        services[i].uuid.toUpperCase() ===
        GATT_PROFILE.services.mabeee.uuid.replace(/-/g, "")
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
              for (const key in noble.mabeee.characteristics) {
                if (
                  characteristics[j].uuid.toUpperCase() ===
                  noble.mabeee.characteristics[key].uuid.replace(/-/g, "")
                ) {
                  noble.mabeee.characteristics[key].instance = characteristics[j];
                }
              }
            }
            noble.mabeee.servicesDiscovered = true;
          }
        );

        await services[i].discoverIncludedServicesAsync();
      }
    }
  });
});

// const waitForDiscover = async () => {
//   while (!noble.servicesDiscovered) {
//     await sleep(100);
//   }
// }

const loopForXiao = async () => {
  let accTimer = 0;
  let gyroTimer = 0;
  let versionTimer = noble.timer.version;
  while (true) {
    if (!noble.xiao.connected) {
      break;
    }
    if (accTimer > noble.timer.accelerometer) {
      await fetchAccelerometer();
      accTimer = 0;
    }
    if (gyroTimer > noble.timer.gyroscope) {
      await fetchGyroscope();
      gyroTimer = 0;
    }
    if (versionTimer > noble.timer.version) {
      await fetchVersion();
      versionTimer = 0;
    }

    await sleep(10);
    accTimer += 10;
    gyroTimer += 10;
    versionTimer += 10;
  }
};

const loopForMabeee = async () => {
  let voltageTimer = 0;
  while (true) {
    if (!noble.mabeee.connected) {
      break;
    }
    if (voltageTimer > noble.timer.voltage) {
      await fetchVoltage();
      voltageTimer = 0;
    }

    await sleep(10);
    voltageTimer += 10;
  }
};

/**
 * fetch accelerometer for iot train
 * @returns 
 */
const fetchAccelerometer = () => {
  return new Promise((resolve, reject) => {
    noble.xiao.characteristics["accelerometer"].instance.read((error, data) => {
      if (error !== null) {
        return reject(error);
      }
      return resolve(data);
    });
  })
  .then((data) => {
    let accelerometer = noble.inbox.xiao.accelerometer
    accelerometer.timestamp = data.readFloatLE(0);
    accelerometer.x = data.readFloatLE(4);
    accelerometer.y = data.readFloatLE(8);
    accelerometer.z = data.readFloatLE(12);
    return;
  })
  .catch((error) => {
    loggerChild.error(error);
    let accelerometer = noble.inbox.xiao.accelerometer
    accelerometer.timestamp = null;
    accelerometer.x = null;
    accelerometer.y = null;
    accelerometer.z = null;
    return;
  });
};

/**
 * fetch Gyroscope
 * @returns 
 */
const fetchGyroscope = () => {
  return new Promise((resolve, reject) => {
    noble.xiao.characteristics["gyroscope"].instance.read((error, data) => {
      if (error !== null) {
        return reject(error);
      }
      return resolve(data);
    });
  })
  .then((data) => {
    noble.inbox.xiao["gyroscope"].timestamp = data.readFloatLE(0);
    noble.inbox.xiao["gyroscope"].x = data.readFloatLE(4);
    noble.inbox.xiao["gyroscope"].y = data.readFloatLE(8);
    noble.inbox.xiao["gyroscope"].z = data.readFloatLE(12);
    return;
  })
  .catch((error) => {
    loggerChild.error(error);
    noble.inbox.xiao["gyroscope"].timestamp = null;
    noble.inbox.xiao["gyroscope"].x = null;
    noble.inbox.xiao["gyroscope"].y = null;
    noble.inbox.xiao["gyroscope"].z = null;
    return;
  });
};

/**
 * fetch voltage for iot train
 * @returns 
 */
const fetchVoltage =  () => {
       new Promise((resolve, reject) => {
        lock.acquire('my-lock', async (resolve, reject) => {

        noble.mabeee.characteristics["voltage"].instance.write(
          new Buffer.from([0x00]),
          true,
          (error) => {
            if (error !== null) {
              return reject(error);
            }
            //return resolve();
          });
          await sleep(100);
        }, 
        (err,result) => { 
          if(err) {
            return reject(err);
          }
          return resolve();
    
        }
        ); // lock
    }).then(() => {
      // if (data.readFloatLE(4) !== 0) {
      //   noble.inbox.mabeee["voltage"].timestamp = data.readFloatLE(0);
      //   noble.inbox.mabeee["voltage"].value = data.readFloatLE(4);
      //   if (
      //     noble.inbox.mabeee["voltage"].value <= 1.2 &&
      //     noble.inbox.mabeee["voltage"].value > 0
      //   ) {
      //     loggerChild.warn(
      //       "battery voltage is low!! :" + noble.inbox["voltage"].value + "V"
      //     );
      //   }
      // }
     // return;
    })
    .catch((error) => {
      loggerChild.error(error);
      noble.inbox.mabeee["voltage"].timestamp = null;
      noble.inbox.mabeee["voltage"].value = null;
      //return;
    });
    
};

/**
 * Set PWM value for iot train 
 * @param {number} pwm 
 * @returns 
 */
prev_pwm=0;
const setPwm = (pwm) => {
      return  new Promise((resolve, reject) => {
      setTimeout(() => reject('timeout'), 1000);
      noble.inbox.mabeee["pwm"].targetValue = pwm;
      lock.acquire('my-lock',  async (resolve, reject) => {
          if(prev_pwm!=pwm) {
            prev_pwm=pwm;
            noble.mabeee.characteristics["pwm"].instance.write(
              new Buffer.from([0x01, pwm, 0x0, 0x0, 0x0]),
              false,
              (error) => {
                if (error !== null) {
                  return reject(error);
                }
                //return resolve();
              }
            ) 
            await sleep(100);
          }
          }
          ,(err,result) => { 
          if(err) {
            loggerChild.error(err);
            return reject(err);
          }
            return resolve();
        });
      }).then((result) => {
            return null;
      }).catch((error) => {
            loggerChild.error(error);
            return error;
      });
}


/**
 * fetch pwm
 * @returns 
 */
const fetchPwm = () => {
  return new Promise((resolve, reject) => {
    setTimeout(() => reject('timeout'), 10000);
    noble.mabeee.characteristics["pwm"].instance.read((error, data) => {
      if (error !== null) {
        return reject(error);
      }
      return resolve(data);
    });
  })
  .then((data) => {
    noble.inbox.mabeee["pwm"].value = data.readUInt8(0);
    return;
  })
  .catch((error) => {
    loggerChild.error(error);
    noble.inbox.mabeee["pwm"].value = null;
    return;
  });
};

/**
 * fetch firmware version for iot_train 
 * @returns 
 */
const fetchVersion = () => {
  return new Promise((resolve, reject) => {
    setTimeout(() => reject('timeout'), 10000);
    noble.xiao.characteristics["version"].instance.read((error, data) => {
      if (error !== null) {
        return reject(error);
      }
      return resolve(data);
    });
  })
  .then((data) => {
    noble.inbox.xiao["version"] = data.readUInt16LE(0) + "." + data.readUInt16LE(2);
    return;
  })
  .catch((error) => {
    loggerChild.error(error);
    noble.inbox.xiao["version"] = null;
    return;
  });
};

/**
 * get Accelerometer
 * @returns Accelerometer
 */
const getAccelerometer = () => {
  return noble.inbox.xiao.accelerometer;
};

/**
 * get Gyroscope
 * @returns Gyroscope
 */
const getGyroscope = () => {
  return noble.inbox.xiao.gyroscope;
};

/**
 * get Voltage
 * @returns Voltage
 */
const getVoltage = () => {
  return noble.inbox.mabeee.voltage;
};

/**
 * get firmware version for xiao
 * @returns Voltage
 */
const getVersion = () => {
  return noble.inbox.xiao.version;
};

/**
 * get MaBeee Name
 * @returns MaBeee Name
 */
const getMaBeeeName = () => {
  return noble.inbox.mabeee.name;
};

//module.exports = noble;
module.exports = {
  setPwm,
  getAccelerometer,
  getGyroscope,
  getVoltage,
  getVersion,
  getMaBeeeName,
}
