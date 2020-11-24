/* global Module, moment */

/* Magic Mirror Module: MMM-RemoteTemperature (https://github.com/balassy/MMM-RemoteTemperature)
 * By György Balássy (https://www.linkedin.com/in/balassy)
 * MIT Licensed.
 */

Module.register('MMM-RemoteTemperature', {
  defaults: {
    sensorId: null,
    icon: 'home',
    showMore: true
  },

  requiresVersion: '2.1.0',

  getScripts() {
    return [
      'moment.js'
    ];
  },

  getStyles() {
    return [
      'MMM-RemoteTemperature.css',
      'font-awesome.css'
    ];
  },

  getTranslations() {
    return {
      en: 'translations/en.json',
      hu: 'translations/hu.json'
    };
  },

  start() {
    this.viewModel = null;
    this._initCommunication();
    this.sendSocketNotification('CONFIG', this.config);
  },

  getDom() {
    const wrapper = document.createElement('div');

    if (this.viewModel) {
      const firstLineEl = document.createElement('div');

      if (this.config.icon) {
        const iconEl = document.createElement('span');
        iconEl.classList = `symbol fa fa-${this.config.icon}`;
        firstLineEl.appendChild(iconEl);
      }

      if (this.viewModel.temp) {
        const tempEl = document.createElement('span');
        tempEl.classList = 'temp';
        tempEl.innerHTML = `${Math.round(this.viewModel.temp*10)/10}&deg;`;
        firstLineEl.appendChild(tempEl);
      }

      if (this.viewModel.humidity) {
        const humidityEl = document.createElement('span');
        humidityEl.classList = 'humidity';
        humidityEl.innerHTML = `${Math.round(this.viewModel.humidity)}%`;
        firstLineEl.appendChild(humidityEl);
      }

      wrapper.appendChild(firstLineEl);

      if (this.config.showMore) {
        const secondLineEl = document.createElement('div');
        secondLineEl.classList = 'more dimmed small';
        secondLineEl.innerHTML = `<span class="fa fa-refresh"></span> ${this._formatTimestamp(this.viewModel.timestamp)}`;

        if (this.viewModel.battery) {
          secondLineEl.innerHTML += `<span class="fa fa-battery-half"></span> ${this.viewModel.battery}%`;
        }

        wrapper.appendChild(secondLineEl);
      }
    } else {
      const loadingEl = document.createElement('span');
      loadingEl.innerHTML = this.translate('LOADING');
      loadingEl.classList = 'dimmed small';
      wrapper.appendChild(loadingEl);
    }

    return wrapper;
  },

  socketNotificationReceived(notificationName, payload) {
    if (notificationName === 'MMM-RemoteTemperature.VALUE_RECEIVED' && payload) {
      if (!this.config.sensorId || (this.config.sensorId && this.config.sensorId === payload.sensorId)) {
        this.viewModel = {
          temp: payload.temp,
          humidity: payload.humidity,
          battery: payload.battery,
          timestamp: Date.now()
        };

        this.updateDom();
      }
    }
  },

  _initCommunication() {
    this.sendSocketNotification('MMM-RemoteTemperature.INIT', {
      sensorId: this.config.sensorId
    });
  },

  _formatTimestamp(timestamp) {
    return moment(timestamp).format('HH:mm');
  },

  notificationReceived: function (notification, payload, sender)
  {
      if (notification == "SignalR.default.environment")
      {
          try
          {
              let json = JSON.parse(payload);

              if (this.config.sensorId !== json.dev_id) return;

              console.log(json);

              this.viewModel = {
                temp: json.payload_fields.t,
                humidity: json.payload_fields.h,
                battery: json.payload_fields.b,
                timestamp: Date.now()
              };

              this.updateDom();
          }
          catch (exception)
          {
              console.warn("Error processing SignalR message: "+exception);
          }
      }
  },
});
