import React from "react";
import I18n from "../lib/i18n";
import qs from "qs";
import reactMixin from 'react-mixin';
import SortableHeader from '../components/sortable_header';
import Link from 'react-router/Link';

import { apiUrl, getApps, getFacets } from "../api";
import sort from "../utils/sort";

import Facets from "../components/facets";
import YesNo from "../components/yes-no";

let store = {
  activeFacets: null,
  hiddenFacets: null
};

class AppOverview extends React.Component {
  constructor() {
    super();

    this.state = {
      apps: [],
      facets: [],
      search: "",
      activeFacets: store.activeFacets || {},
      hiddenFacets: store.hiddenFacets || {},
      sortAttribute: "name",
      sortAscending: undefined
    }
  }

  componentWillMount() {
    const { currentUser } = this.context;

    Promise.all([
      getFacets().then((data) => {
        return data.payload;
      }),
      getApps(currentUser.getCurrentIdpId()).then((data) => {
        return data.payload;
      })
    ]).then(data => {
      const [facets, apps] = data;

      // We need to sanitize the categories data for each app to ensure the facet totals are correct
      var unknown = {value: I18n.t("facets.unknown")};
      facets.forEach(function (facet) {
        apps.forEach(function (app) {
          app.categories = app.categories || [];
          var appCategory = app.categories.filter(function (category) {
            return category.name === facet.name;
          });
          if (appCategory.length === 0) {
            app.categories.push({name: facet.name, values: [unknown]});
            var filtered = facet.values.filter(function (facetValue) {
              return facetValue.value === unknown.value;
            });
            if (!filtered[0]) {
              facet.values.push(Object.assign({}, unknown));
            }
          }
        });
      });

      this.setState({ apps, facets });
    });
  }

  handleSort(sortObject) {
    this.setState({
      sortAttribute: sortObject.sortAttribute,
      sortAscending: sortObject.sortAscending
    });
  }

  render() {
    const { currentUser } = this.context;
    const { sortAttribute, sortAscending } = this.state;
    var filteredExclusiveApps = this.filterAppsForExclusiveFilters(this.state.apps);

    if (currentUser.dashboardAdmin && currentUser.getCurrentIdp().institutionId) {
      var connect = (
        <th className="percent_10 right">
          {I18n.t("apps.overview.connect")}
        </th>
      );
    }

    var facets = this.staticFacets().concat(this.state.facets);
    this.addNumbers(filteredExclusiveApps, facets);
    var filteredApps = this.filterAppsForInclusiveFilters(filteredExclusiveApps);

    return (
      <div className="l-main">
        <div className="l-left">
          <Facets
            facets={facets}
            selectedFacets={this.state.activeFacets}
            hiddenFacets={this.state.hiddenFacets}
            filteredCount={filteredApps.length}
            totalCount={this.state.apps.length}
            onChange={this.handleFacetChange.bind(this)}
            onHide={this.handleFacetHide.bind(this)}
            onReset={this.handleResetFilters.bind(this)}
            onDownload={this.handleDownloadOverview.bind(this)}/>
        </div>
        <div className="l-right">
          <div className="mod-app-search">
            <form>
              <fieldset>
                <i className="fa fa-search"/>
                <input
                  type="search"
                  value={this.state.search}
                  onChange={(e) => this.setState({ search: e.target.value })}
                  placeholder={I18n.t("apps.overview.search_hint")}/>

                <button type="submit">{I18n.t("apps.overview.search")}</button>
              </fieldset>
            </form>
          </div>
          <div className="mod-app-list">
            <table>
              <thead>
                <tr>
                  {this.renderSortableHeader("percent_25", "name")}
                  {this.renderSortableHeader("percent_15", "licenseStatus")}
                  {this.renderSortableHeader("percent_15", "license")}
                  {this.renderSortableHeader("percent_15", "connected")}
                  {connect}
                </tr>
              </thead>
              <tbody>
                {filteredApps.length > 0 ? sort(filteredApps, sortAttribute, sortAscending).map(app => this.renderApp(app)) : this.renderEmpty()}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }


  renderSortableHeader(className, attribute) {
    return (
      <SortableHeader
        sortAttribute={this.state.sortAttribute}
        attribute={attribute}
        sortAscending={this.state.sortAscending}
        localeKey="apps.overview"
        className={className}
        onSort={this.handleSort.bind(this)}
        />
    );
  }

  renderEmpty() {
    return (
      <tr>
        <td className="empty" colSpan="4">{I18n.t("apps.overview.no_results")}</td>;
      </tr>
    );
  }

  renderApp(app) {
    const { currentUser } = this.context;
    if (currentUser.dashboardAdmin && currentUser.getCurrentIdp().institutionId) {
      var connect = (
        <td className="right">
          {this.renderConnectButton(app)}
        </td>
      );
    }

    return (
      <tr key={app.id} onClick={(e) => this.handleShowAppDetail(e, app)}>
        <td><Link to={`apps/${app.id}`}>{ app.name }</Link></td>
        {this.renderLicenseNeeded(app)}
        {this.renderLicensePresent(app)}
        <YesNo value={app.connected} />
        {connect}
      </tr>
    );
  }

  licenseStatusClassName(app) {
    switch (app.licenseStatus) {
      case "HAS_LICENSE_SURFMARKET":
      case "HAS_LICENSE_SP":
        return "yes"
      case "NO_LICENSE":
        return "no";
      default:
        return "";
    }
  }

  renderLicenseNeeded(app) {
    return (
      <td
        className={this.licenseStatusClassName(app)}>{I18n.t("facets.static.license." + app.licenseStatus.toLowerCase())}</td>
    );
  }

  renderLicensePresent(app) {
    let licensePresent = "unknown";

    switch (app.licenseStatus) {
      case "HAS_LICENSE_SURFMARKET":
        if (!app.hasCrmLink) {
          licensePresent = "unknown";
        } else {
          licensePresent = app.license ? "yes" : "no";
        }
        break;
      case "HAS_LICENSE_SP":
        licensePresent = "unknown";
        break;
      case "NOT_NEEDED":
        licensePresent = "na";
        break;
      default:
        licensePresent = "unknown";
        break;
    }

    return (
      <td className={licensePresent}>{I18n.t("apps.overview.license_present." + licensePresent)}</td>
    );
  }

  renderConnectButton(app) {
    if (!app.connected) {
      return <a onClick={this.handleShowHowToConnect(app)} className="c-button narrow">{I18n.t("apps.overview.connect_button")}</a>;
    }
  }

  handleShowAppDetail(e, app) {
    e.preventDefault();
    e.stopPropagation();
    this.context.router.transitionTo(`/apps/${app.id}`);
  }

  handleShowHowToConnect(app) {
    return function (e) {
      e.preventDefault();
      e.stopPropagation();
      page("/apps/:id/how_to_connect", {id: app.id});
    }
  }

  /*
   * this.state.activeFacets is a object with facet names and the values are arrays with all select values
   */
  handleFacetChange(facet, facetValue, checked) {
    var selectedFacets = _.merge({}, this.state.activeFacets);
    var facetValues = selectedFacets[facet];

    if (_.isUndefined(facetValues)) {
      facetValues = selectedFacets[facet] = [facetValue];
    } else {
      checked ? facetValues.push(facetValue) : facetValues.splice(facetValues.indexOf(facetValue), 1);
    }

    this.setState({activeFacets: selectedFacets});

    store.activeFacets = selectedFacets;
  }

  handleFacetHide(facet) {
    var hiddenFacets = _.merge({}, this.state.hiddenFacets);
    if (hiddenFacets[facet.name]) {
      delete hiddenFacets[facet.name];
    } else {
      hiddenFacets[facet.name] = true;
    }
    this.setState({hiddenFacets: hiddenFacets});
    store.hiddenFacets = hiddenFacets;
  }

  handleResetFilters() {
    this.setState({
      search: "",
      activeFacets: {},
      hiddenFacets: {}
    });

    store.activeFacets = null;
    store.hiddenFacets = null;
  }

  handleDownloadOverview() {
    const { currentUser } = this.context;
    const filteredApps = this.filterAppsForInclusiveFilters(this.filterAppsForExclusiveFilters(this.state.apps));
    const ids = filteredApps.map(app => app.id);
    const queryString = qs.stringify({ idpEntityId: currentUser.getCurrentIdpId(), id: ids }, { arrayFormat: 'brackets' });

    window.open(apiUrl(`/services/download?${queryString}`));
  }

  filterAppsForExclusiveFilters(apps) {
    return apps.filter(this.filterBySearchQuery.bind(this));
  }

  filterAppsForInclusiveFilters(apps) {
    var filteredApps = apps;

    if (!_.isEmpty(this.state.activeFacets)) {
      filteredApps = filteredApps.filter(this.filterByFacets(this.state.activeFacets));
      this.staticFacets().forEach(function (facetObject) {
        filteredApps = filteredApps.filter(facetObject.filterApp);
      });
    }

    return filteredApps;
  }

  addNumbers(filteredApps, facets) {
    const { currentUser } = this.context;
    var me = this;
    var filter = function (facet, filterFunction) {
      var activeFacetsWithoutCurrent = _.pick(this.state.activeFacets, function (value, key, object) {
        return key !== facet.name;
      });
      var filteredWithoutCurrentFacetApps = filteredApps.filter(this.filterByFacets(activeFacetsWithoutCurrent));

      this.staticFacets().filter(function (facetObject) {
        return facetObject.searchValue != facet.searchValue;
      }).forEach(function (facetObject) {
        filteredWithoutCurrentFacetApps = filteredWithoutCurrentFacetApps.filter(facetObject.filterApp);
      });

      facet.values.forEach(function (facetValue) {
        facetValue.count = filteredWithoutCurrentFacetApps.filter(function (app) {
          return filterFunction(app, facetValue);
        }).length;
      });
    }.bind(this);

    facets.forEach(function (facet) {
      switch (facet.searchValue) {
        case "connection":
          filter(facet, function (app, facetValue) {
            return facetValue.searchValue === "yes" ? app.connected : !app.connected;
          });
          break;
        case "license":
          filter(facet, function (app, facetValue) {
            return app.licenseStatus === facetValue.searchValue;
          });
          break;
        case "used_by_idp":
          filter(facet, function (app, facetValue) {
            var usedByIdp = currentUser.getCurrentIdp().institutionId === app.institutionId;
            return facetValue.searchValue === "yes" ? usedByIdp : !usedByIdp;
          });
          break;
        case "published_edugain":
          filter(facet, function (app, facetValue) {
            var published = app.publishedInEdugain || false;
            return facetValue.searchValue === "yes" ? published : !published;
          });
          break;
        default:
          filter(facet, function (app, facetValue) {
            var categories = me.normalizeCategories(app);
            var appTags = categories[facet.name] || [];
            return appTags.indexOf(facetValue.value) > -1;
          });
      }
    });
  }

  filterBySearchQuery(app) {
    return app.name.toLowerCase().indexOf(this.state.search.toLowerCase()) >= 0;
  }

  filterYesNoFacet(name, yes) {
    var values = this.state.activeFacets[name] || [];
    return values.length === 0
      || (yes && _.includes(values, "yes"))
      || (!yes && _.includes(values, "no"));
  }

  filterByFacets(facets) {
    return function (app) {
      var normalizedCategories = this.normalizeCategories(app);
      for (var facet in facets) {
        var facetValues = facets[facet] || [];
        if (normalizedCategories[facet] && facetValues.length > 0) {
          var hits = normalizedCategories[facet].filter(function (facetValue) {
            return facetValues.indexOf(facetValue) > -1;
          });
          if (hits.length === 0) {
            return false;
          }
        }
      }
      return true;
    }.bind(this);
  }

  normalizeCategories(app) {
    var normalizedCategories = {}
    app.categories.forEach(function (category) {
      normalizedCategories[category.name] = category.values.map(function (categoryValue) {
        return categoryValue.value;
      });
    });
    return normalizedCategories;
  }

  staticFacets() {
    const { currentUser } = this.context;

    return [{
      name: I18n.t("facets.static.connection.name"),
      searchValue: "connection",
      values: [
        {value: I18n.t("facets.static.connection.has_connection"), searchValue: "yes"},
        {value: I18n.t("facets.static.connection.no_connection"), searchValue: "no"},
      ],
      filterApp: function (app) {
        return this.filterYesNoFacet("connection", app.connected);
      }.bind(this),
    }, {
      name: I18n.t("facets.static.used_by_idp.name"),
      searchValue: "used_by_idp",
      values: [
        {value: I18n.t("facets.static.used_by_idp.yes"), searchValue: "yes"},
        {value: I18n.t("facets.static.used_by_idp.no"), searchValue: "no"},
      ],
      filterApp: function (app) {
        return this.filterYesNoFacet("used_by_idp", currentUser.getCurrentIdp().institutionId === app.institutionId);
      }.bind(this),
    }, {
      name: I18n.t("facets.static.published_edugain.name"),
      searchValue: "published_edugain",
      values: [
        {value: I18n.t("facets.static.published_edugain.yes"), searchValue: "yes"},
        {value: I18n.t("facets.static.published_edugain.no"), searchValue: "no"},
      ],
      filterApp: function (app) {
        return this.filterYesNoFacet("published_edugain", app.publishedInEdugain);
      }.bind(this),
    }, {
      name: I18n.t("facets.static.license.name"),
      searchValue: "license",
      values: [
        {value: I18n.t("facets.static.license.has_license_surfmarket"), searchValue: "HAS_LICENSE_SURFMARKET"},
        {value: I18n.t("facets.static.license.has_license_sp"), searchValue: "HAS_LICENSE_SP"},
        {value: I18n.t("facets.static.license.not_needed"), searchValue: "NOT_NEEDED"},
        {value: I18n.t("facets.static.license.unknown"), searchValue: "UNKNOWN"},
      ],
      filterApp: function (app) {
        var licenseFacetValues = this.state.activeFacets["license"] || [];
        return licenseFacetValues.length === 0 || licenseFacetValues.indexOf(app.licenseStatus) > -1;
      }.bind(this)
    }];
  }

}

AppOverview.contextTypes = {
  currentUser: React.PropTypes.object,
  router: React.PropTypes.object
};

export default AppOverview;
