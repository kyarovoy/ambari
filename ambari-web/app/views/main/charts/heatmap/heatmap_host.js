/**
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements. See the NOTICE file distributed with this
 * work for additional information regarding copyright ownership. The ASF
 * licenses this file to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

var date = require('utils/date/date');

var App = require('app');

App.MainChartsHeatmapHostView = Em.View.extend({
  templateName: require('templates/main/charts/heatmap/heatmap_host'),

  didInsertElement: function() {
    $("#heatmapDetailsBlock").hide();
  },

  /** @private */
  hostClass: 'hostBlock',

  /**
   * link to host record in App.Host model
   */
  hostModelLink: function () {
    return App.Host.find(this.get('content.hostName'));
  }.property('content.hostName'),

  /**
   * show Host details block and move it near the cursor
   *
   * @param {Object} event
   * @this App.MainChartsHeatmapHostView
   */
  mouseEnter: function (event) {
    var host = this.get('content'),
        view = App.MainChartsHeatmapHostDetailView.create();

    Object.keys(view.get('details')).forEach(function (i) {
      var val = host[i];

      switch (i) {
        case 'diskUsage':
          val = this.getUsage(host['diskTotal'], host['diskFree']);
          break;
        case 'cpuUsage':
          val = this.getCpuUsage(host['cpuSystem'], host['cpuUser']);
          break;
        case 'memoryUsage':
          val = this.getUsage(host['memTotal'], host['memFree']);
          break;
        case 'hostComponents':
          val = this.getHostComponents(host[i]);
      }

      view.set('details.' + i, val);
    }, this);
    this.setMetric(view, host);
    this.openDetailsBlock(event);
  },

  /**
   * get relative usage of metric in percents
   * @param {number} total
   * @param {number} free
   * @return {string}
   */
  getUsage: function (total, free) {
    var result = 0;

    if (Number.isFinite(total) && Number.isFinite(free) && total > 0) {
      result = ((total - free) / total) * 100;
    }
    return result.toFixed(1);
  },

  /**
   * get CPU usage
   * @param {number} cpuSystem
   * @param {number} cpuUser
   * @returns {string}
   */
  getCpuUsage: function (cpuSystem, cpuUser) {
    var result = 0;

    if (Number.isFinite(cpuSystem) && Number.isFinite(cpuUser)) {
      result = cpuSystem + cpuUser;
    }
    return result.toFixed(1);
  },

  /**
   * get non-client host-components of host
   * @param {Array} components
   * @returns {string}
   */
  getHostComponents: function (components) {
    var nonClientComponents = App.get('components.slaves').concat(App.get('components.masters'));
    var result = [];

    components.forEach(function (componentName) {
      if (nonClientComponents.contains(componentName)) {
        result.push(App.format.role(componentName));
      }
    }, this);
    return result.join(', ')
  },

  /**
   * show tooltip with host's details
   */
  openDetailsBlock: function (event) {
    var detailsBlock = $("#heatmapDetailsBlock");

    detailsBlock.css('top', event.pageY + 10);
    detailsBlock.css('left', event.pageX + 10);
    detailsBlock.show();
  },

  /**
   * set name and value of selected metric
   * @param view
   * @param host
   */
  setMetric: function (view, host) {
    var selectedMetric = this.get('controller.selectedMetric');

    if (selectedMetric) {
      var metricName = selectedMetric.get('name');
      var h2vMap = selectedMetric.get('hostToValueMap');
      if (h2vMap && metricName) {
        var value = h2vMap[host.hostName];
        if (Em.isNone(value)) {
          value = this.t('charts.heatmap.unknown');
        } else {
          if (metricName === 'Garbage Collection Time') {
            value = date.timingFormat(parseInt(value));
          } else {
            if (isNaN(value)) {
              value = this.t('charts.heatmap.unknown');
            } else {
              value = value + selectedMetric.get('units');
            }
          }
        }
        view.set('details.metricName', metricName);
        view.set('details.metricValue', value);
      }
    }
  },

  /**
   * hide Host details block
   *
   * @param {Object} e
   * @this App.MainChartsHeatmapHostView
   */
  mouseLeave: function (e) {
    $("#heatmapDetailsBlock").hide();
  },

  hostTemperatureStyle: function () {
    var controller = this.get('controller');
    var h2sMap = controller.get('hostToSlotMap');
    if (h2sMap) {
      var hostname = this.get('content.hostName');
      if (hostname) {
        var slot = h2sMap[hostname];
        if (slot > -1) {
          var slotDefs = controller.get('selectedMetric.slotDefinitions');
          if (slotDefs && slotDefs.length > slot) {
            return slotDefs[slot].get('cssStyle');
          }
        }
      }
    }
    return '';
  }.property('controller.hostToSlotMap')
});
