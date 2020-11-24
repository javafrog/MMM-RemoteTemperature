const bodyParser = require('body-parser');
const NodeHelper = require('node_helper'); // eslint-disable-line import/no-unresolved
const bent = require("bent");

module.exports = NodeHelper.create({
  start() {
    this._initHandler();
    this.config = {};
  },

  socketNotificationReceived(notificationName, payload) {
    if (notificationName === 'MMM-RemoteTemperature.INIT') {
      console.log(`MMM-RemoteTemperature Node helper: Init notification received from module for sensor "${payload.sensorId}".`); // eslint-disable-line no-console
    }
    
        // client has started up
        if (notificationName === "CONFIG")
        {
            // only init once for each module instance
            if (!(payload.name in this.config))
            {
                console.log("Starting data calls for " + payload.name + ", Interval: " + payload.updateInterval + " ms");
                this.config[payload.name] = payload;
                this.sendSocketNotification("STARTED", payload.name);
                this.retrieveData(payload.name);
            }
        }
  },

  _initHandler() {
    this.expressApp.use(bodyParser.json());
    this.expressApp.post('/remote-temperature', this._onTemperatureValueReceived.bind(this));
  },

  retrieveData: async function (name)
  {
      const self = this;
      const url = this.config[name].url;

      const request = bent(url, "GET", "json", 200, this.config[name].urlHeaders);

      try
      {
          let response = await request();
          
          const payload = {
            temp: response.payload_fields.t,
            humidity: response.payload_fields.h,
            battery: response.payload_fields.b,
            sensorId: response.dev_id
          };
          
          this.sendSocketNotification('MMM-RemoteTemperature.VALUE_RECEIVED', payload);
      }
      catch (e)
      {
          self.sendSocketNotification("DATA_ERROR_" + name);
          console.error(name, e.message);
      }

      // no need to repeat, we are using signalr
      setTimeout(function () { self.retrieveData(name); }, this.config[name].updateInterval);
  },

  _onTemperatureValueReceived(req, res) {
    const params = req.body;

    const payload = {
      temp: params.temp,
      humidity: params.humidity,
      battery: params.battery,
      sensorId: params.sensorId
    };

    this.sendSocketNotification('MMM-RemoteTemperature.VALUE_RECEIVED', payload);

    res.sendStatus(200);
  }
});
