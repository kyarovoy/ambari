/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var App = require('app');
var filters = require('views/common/filter_view'),
  sort = require('views/common/sort_view'),
  date = require('utils/date');

App.MainAlertDefinitionsView = App.TableView.extend({

  templateName: require('templates/main/alerts'),

  content: [],

  contentObs: function () {
    Em.run.once(this, this.contentObsOnce);
  }.observes('controller.content.[]'),

  contentObsOnce: function() {
    var content = this.get('controller.content') ? this.get('controller.content').toArray().sort(App.AlertDefinition.getSortDefinitionsByStatus(true)) : [];
    this.set('content', content);
  },

  willInsertElement: function () {
    if (!this.get('controller.showFilterConditionsFirstLoad')) {
      this.clearFilterCondition();
      this.clearStartIndex();
    }
    this.removeObserver('filteredCount', this, 'updatePaging');
    this.removeObserver('displayLength', this, 'updatePaging');
    var startIndex = App.db.getStartIndex(this.get('controller.name'));
    this._super();
    this.set('startIndex', startIndex ? startIndex : 1);
    this.addObserver('filteredCount', this, 'updatePaging');
    this.addObserver('displayLength', this, 'updatePaging');
  },

  /**
   * Method is same as in the parentView, but observes are set in the <code>willInsertElement</code>
   * and not in the declaration
   */
  updatePaging: function () {
    this._super();
  },

  didInsertElement: function () {
    var self = this;
    Em.run.next(function () {
      self.set('isInitialRendering', false);
      self.contentObsOnce();
      self.tooltipsUpdater();
    });
  },

  willDestroyElement: function () {
    this.removeObserver('pageContent.length', this, 'tooltipsUpdater');
  },

  /**
   * Save <code>startIndex</code> to the localStorage
   * @method saveStartIndex
   */
  saveStartIndex: function() {
    App.db.setStartIndex(this.get('controller.name'), this.get('startIndex'));
  }.observes('startIndex'),

  /**
   * Clear <code>startIndex</code> from the localStorage
   * @method clearStartIndex
   */
  clearStartIndex: function () {
    App.db.setStartIndex(this.get('controller.name'), null);
  },

  /**
   * @type {number}
   */
  totalCount: function () {
    return this.get('content.length');
  }.property('content.length'),

  colPropAssoc: ['', 'label', 'summary', 'serviceName', 'type', 'lastTriggered', 'enabled', 'groups'],

  /**
   * @type {string}
   */
  enabledTooltip: Em.I18n.t('alerts.table.state.enabled.tooltip'),

  /**
   * @type {string}
   */
  disabledTooltip: Em.I18n.t('alerts.table.state.disabled.tooltip'),

  /**
   * @type {string}
   */
  enabledDisplay: Em.I18n.t('alerts.table.state.enabled'),

  /**
   * @type {string}
   */
  disabledDisplay: Em.I18n.t('alerts.table.state.disabled'),

  sortView: sort.wrapperView,

  /**
   * Define whether initial view rendering has finished
   * @type {Boolean}
   */
  isInitialRendering: true,

  /**
   * Sorting header for <label>alertDefinition.label</label>
   * @type {Em.View}
   */
  nameSort: sort.fieldView.extend({
    column: 1,
    name: 'label',
    displayName: Em.I18n.t('alerts.table.header.definitionName')
  }),

  /**
   * Sorting header for <label>alertDefinition.status</label>
   * @type {Em.View}
   */
  statusSort: sort.fieldView.extend({
    column: 2,
    name: 'summary',
    displayName: Em.I18n.t('common.status'),
    type: 'alert_status',
    status: 'sorting_desc'
  }),

  /**
   * Sorting header for <label>alertDefinition.service.serviceName</label>
   * @type {Em.View}
   */
  serviceSort: sort.fieldView.extend({
    column: 3,
    name: 'serviceDisplayName',
    displayName: Em.I18n.t('common.service'),
    type: 'string'
  }),

  /**
   * Sorting header for <label>alertDefinition.type</label>
   * @type {Em.View}
   */
  typeSort: sort.fieldView.extend({
    column: 4,
    name: 'type',
    displayName: Em.I18n.t('common.type'),
    type: 'string'
  }),

  /**
   * Sorting header for <label>alertDefinition.lastTriggeredSort</label>
   * @type {Em.View}
   */
  lastTriggeredSort: sort.fieldView.extend({
    column: 5,
    name: 'lastTriggered',
    displayName: Em.I18n.t('alerts.table.header.lastTriggered'),
    type: 'number'
  }),

  /**
   * Sorting header for <label>alertDefinition.enabled</label>
   * @type {Em.View}
   */
  enabledSort: sort.fieldView.extend({
    template:Em.Handlebars.compile('<span {{bindAttr class="view.status :column-name"}}>{{t alerts.table.state}}</span>'),
    column: 6,
    name: 'enabled'
  }),

  /**
   * Filtering header for <label>alertDefinition.label</label>
   * @type {Em.View}
   */
  nameFilterView: filters.createTextView({
    column: 1,
    fieldType: 'filter-input-width',
    onChangeValue: function(){
      this.get('parentView').updateFilter(this.get('column'), this.get('value'), 'string');
    }
  }),

  /**
   * Filtering header for <label>alertDefinition.status</label>
   * @type {Em.View}
   */
  stateFilterView: filters.createSelectView({
    column: 2,
    fieldType: 'filter-input-width',
    content: [
      {
        value: '',
        label: Em.I18n.t('common.all')
      },
      {
        value: 'OK',
        label: 'OK'
      },
      {
        value: 'WARNING',
        label: 'WARNING'
      },
      {
        value: 'CRITICAL',
        label: 'CRITICAL'
      },
      {
        value: 'UNKNOWN',
        label: 'UNKNOWN'
      },
      {
        value: 'PENDING',
        label: 'NONE'
      }
    ],
    onChangeValue: function () {
      this.get('parentView').updateFilter(this.get('column'), this.get('value'), 'alert_status');
    }
  }),

  /**
   * Filtering header for <label>alertDefinition.service.serviceName</label>
   * @type {Em.View}
   */
  serviceFilterView: filters.createSelectView({
    column: 3,
    fieldType: 'filter-input-width',
    content: function () {
      return [
        {
          value: '',
          label: Em.I18n.t('common.all')
        }
      ].concat(App.Service.find().map(function (service) {
        return {
          value: service.get('serviceName'),
          label: service.get('displayName')
        }
      }).concat([
        {
          value: 'AMBARI',
          label: Em.I18n.t('app.name')
        }
      ]));
    }.property('App.router.clusterController.isLoaded'),
    onChangeValue: function () {
      this.get('parentView').updateFilter(this.get('column'), this.get('value'), 'select');
    }
  }),

  /**
   * Filtering header for <label>alertDefinition.type</label>
   * @type {Em.View}
   */
  typeFilterView: filters.createSelectView({
    column: 4,
    fieldType: 'filter-input-width',
    content: [
      {
        value: '',
        label: Em.I18n.t('common.all')
      },
      {
        value: 'SCRIPT',
        label: 'SCRIPT'
      },
      {
        value: 'WEB',
        label: 'WEB'
      },
      {
        value: 'PORT',
        label: 'PORT'
      },
      {
        value: 'METRIC',
        label: 'METRIC'
      },
      {
        value: 'AGGREGATE',
        label: 'AGGREGATE'
      },
      {
        value: 'SERVER',
        label: 'SERVER'
      }
    ],
    onChangeValue: function(){
      this.get('parentView').updateFilter(this.get('column'), this.get('value'), 'select');
    }
  }),

  /**
   * Filtering header for <label>alertDefinition.lastTriggered</label>
   * @type {Em.View}
   */
  triggeredFilterView: filters.createSelectView({
    column: 5,
    appliedEmptyValue: ["", ""],
    fieldType: 'filter-input-width,modified-filter',
    content: [
      {
        value: 'Any',
        label: Em.I18n.t('any')
      },
      {
        value: 'Past 1 hour',
        label: 'Past 1 hour'
      },
      {
        value: 'Past 1 Day',
        label: 'Past 1 Day'
      },
      {
        value: 'Past 2 Days',
        label: 'Past 2 Days'
      },
      {
        value: 'Past 7 Days',
        label: 'Past 7 Days'
      },
      {
        value: 'Past 14 Days',
        label: 'Past 14 Days'
      },
      {
        value: 'Past 30 Days',
        label: 'Past 30 Days'
      }
    ],
    emptyValue: 'Any',
    onChangeValue: function () {
      this.get('parentView').updateFilter(this.get('column'), this.get('value'), 'date');
    }
  }),

  /**
   * Filtering header for <label>alertDefinition.enabled</label>
   * @type {Em.View}
   */
  enabledFilterView:  filters.createSelectView({
    column: 6,
    fieldType: 'filter-input-width',
    content: [
      {
        value: '',
        label: Em.I18n.t('common.all')
      },
      {
        value: 'enabled',
        label: Em.I18n.t('alerts.table.state.enabled')
      },
      {
        value: 'disabled',
        label: Em.I18n.t('alerts.table.state.disabled')
      }
    ],
    onChangeValue: function () {
      this.get('parentView').updateFilter(this.get('column'), this.get('value'), 'enable_disable');
    }
  }),

  /**
   * Filtering header for <label>alertDefinition</label> groups
   * @type {Em.View}
   */
  alertGroupFilterView: filters.createSelectView({
    column: 7,
    fieldType: 'filter-input-width',
    template: Ember.Handlebars.compile(
      '<div class="display-inline-block">' +
       '<input type="text" class="typeahead" {{bindAttr placeholder="view.alertGroupPlaceholder" }}/>' +
      '</div>'
    ),
    content: [],

    alertGroupPlaceholder: Em.I18n.t('form.validator.alertGroupPlaceHolder'),

    didInsertElement: function() {
      this._super();
      this.updateContent();
      this.set('value', '');
      this.attachAlertGroupDropdown();
    },

    attachAlertGroupDropdown: function() {
      var self = this;
      var node = this.$('.typeahead');
      this.set('typeahead', node.typeahead({
        name: 'alert groups',
        source: self.get('content').mapProperty('label'),
        updater: function (label) {
          var current = self.get('content').findProperty('value', self.get('value')).get('label');
          var entered = self.get('content').findProperty('label', label);
          if (current !==  label && entered) {
            self.selectCategory({
              context: entered
            });
            node.trigger('blur');
          }
          return label;
        },
        items: 9999,
        minLength: 0,
        matcher: function (item) {
          if (this.query === '_SHOW_ALL_') return true;
          return ~item.toLowerCase().indexOf(this.query.toLowerCase());
        }
      }));
      node.val(self.get('content').findProperty('value', '').get('label'));
      node.on('keyup focus', function (e) {
        /**
         * don't update group list on up arrow(38) or down arrow(40) event
         * since Typeahead ignore filtering by empty query, "_SHOW_ALL_" pseudo key used in order
         * to force filtering and show all items
         */
        if ($(this).val().length === 0 && [40, 38].indexOf(e.keyCode) === -1) {
          $(this).val('_SHOW_ALL_');
          $(this).trigger('keyup');
          $(this).val('');
        }
      });
      node.on('blur', function (e) {
        $(self.get('.typeahead')).val(self.get('content').findProperty('value', self.get('value')).get('label'));
      });
    },

    emptyValue: '',

    /**
     * Update list of <code>App.AlertGroup</code> used in the filter
     * @method updateContent
     */
    updateContent: function() {
      var defaultGroups = [];
      var customGroups = [];
      App.AlertGroup.find().forEach(function (group) {
        var item = Em.Object.create({
          value: group.get('id'),
          label: group.get('displayNameDefinitions')
        });
        if (group.get('default')) {
          defaultGroups.push(item);
        } else {
          customGroups.push(item);
        }
      });
      defaultGroups = defaultGroups.sortProperty('label');
      customGroups = customGroups.sortProperty('label');

      this.set('content', [
        Em.Object.create({
          value: '',
          label: Em.I18n.t('common.all') + ' (' + this.get('parentView.controller.content.length') + ')'
        })
      ].concat(defaultGroups, customGroups));
      if (this.get('typeahead')) {
        this.get('typeahead').data('typeahead').source = this.get('content').mapProperty('label');
      }
      this.onValueChange();
    }.observes('App.router.clusterController.isLoaded', 'App.router.manageAlertGroupsController.changeTrigger'),

    selectCategory: function (event) {
      var category = event.context;
      this.set('value', category.value);
      this.get('parentView').updateFilter(this.get('column'), category.value, 'alert_group');
    },

    onValueChange: function () {
      var value = this.get('value');
      if (value != undefined) {
        this.get('content').setEach('selected', false);
        this.set('selected', this.get('content').findProperty('value', value));
        var selectEntry = this.get('content').findProperty('value', value);
        if (selectEntry) {
          selectEntry.set('selected', true);
        }
        this.get('parentView').updateFilter(this.get('column'), value, 'alert_group');
      } else {
        this.set('value', '');
        this.get('parentView').updateFilter(this.get('column'), '', 'alert_group');
      }
    }.observes('value')
  }),

  /**
   * Filtered number of all content number information displayed on the page footer bar
   * @returns {String}
   */
  filteredContentInfo: function () {
    return this.t('alerts.filters.filteredAlertsInfo').format(this.get('filteredCount'), this.get('totalCount'));
  }.property('filteredCount', 'totalCount'),

  /**
   * Determines how display "back"-link - as link or text
   * @type {string}
   */
  paginationLeftClass: function () {
    if (this.get("startIndex") > 1) {
      return "paginate_previous";
    }
    return "paginate_disabled_previous";
  }.property("startIndex", 'filteredCount'),

  /**
   * Determines how display "next"-link - as link or text
   * @type {string}
   */
  paginationRightClass: function () {
    if ((this.get("endIndex")) < this.get("filteredCount")) {
      return "paginate_next";
    }
    return "paginate_disabled_next";
  }.property("endIndex", 'filteredCount'),

  /**
   * Show previous-page if user not in the first page
   * @method previousPage
   */
  previousPage: function () {
    if (this.get('paginationLeftClass') === 'paginate_previous') {
      this._super();
    }
    this.tooltipsUpdater();
  },

  /**
   * Show next-page if user not in the last page
   * @method nextPage
   */
  nextPage: function () {
    if (this.get('paginationRightClass') === 'paginate_next') {
      this._super();
    }
    this.tooltipsUpdater();
  },

  /**
   * Update tooltips when <code>pageContent</code> is changed
   * @method tooltipsUpdater
   */
  tooltipsUpdater: function () {
    Em.run.next(this, function () {
      App.tooltip($(".enable-disable-button, .timeago"));
    });
  },

  updateFilter: function (iColumn, value, type) {
    if (!this.get('isInitialRendering')) {
      this._super(iColumn, value, type);
    }
    this.tooltipsUpdater();
  }

});
