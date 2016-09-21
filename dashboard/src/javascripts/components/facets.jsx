import React from "react";

class Facets extends React.Component {
  render() {
    var facets = this.props.facets;

    return (
      <div className="mod-filters">
        <div className="header">
          <h1>{I18n.t("facets.title")}</h1>
        </div>
        <form>
          <fieldset>
            {this.renderResetFilters()}
            {this.renderDownloadButton()}
          </fieldset>
          {facets.map(this.renderFacet)}
          <fieldset>
            {this.renderTotals()}
          </fieldset>
        </form>
      </div>
    );
  }

  renderResetFilters() {
    return (
      <a
        className={"c-button" + (this.props.filteredCount >= this.props.totalCount ? " disabled" : "")}
        href="#"
        onClick={this.handleResetFilters}>{I18n.t("facets.reset")}</a>
    );
  }

  renderTotals() {
    var count = this.props.filteredCount;
    var total = this.props.totalCount;

    if (count == total) {
      return I18n.t("facets.totals.all", {total: total})
    } else {
      return I18n.t("facets.totals.filtered", {count: count, total: total})
    }
  }

  renderFacet(facet) {
    return (
      <fieldset key={facet.name}>
        <a href="#" onClick={this.handleFacetToggle(facet)}>
          {this.renderDropDownIndicator(facet)}
        </a>

        <h2>{facet.name}</h2>
        {this.renderFacetOptions(facet)}
      </fieldset>
    );
  }

  renderFacetOptions(facet) {
    if (!this.props.hiddenFacets[facet.name]) {
      return (
        facet.values.map(function (value) {
          return this.renderFacetValue(facet, value);
        }.bind(this)));
    }
  }

  handleFacetToggle(facet) {
    return function (e) {
      e.stopPropagation();
      this.props.onHide(facet);
    }.bind(this);
  }

  renderDropDownIndicator(facet) {
    if (this.props.hiddenFacets[facet.name]) {
      return <i className="fa fa-caret-down float-right"/>;
    } else {
      return <i className="fa fa-caret-up float-right"/>;
    }
  }

  renderFacetValue(facet, facetValue) {
    var facetName = facet.searchValue || facet.name;
    var value = facetValue.searchValue || facetValue.value;

    return (
      <label key={facetValue.value} className={facetValue.count === 0 ? "greyed-out" : ""}>
        <input
          checked={Array.isArray(this.props.selectedFacets[facetName]) && this.props.selectedFacets[facetName].indexOf(value) > -1}
          type="checkbox"
          onChange={this.handleSelectFacet(facetName, value)}/>
        {facetValue.value} ({facetValue.count})
      </label>
    );
  }

  renderDownloadButton() {
    return (
      <a href="#" className={"download-button c-button" + (this.props.filteredCount <= 0 ? " disabled" : "")}
         onClick={this.handleDownload}>{I18n.t("facets.download")}</a>
    );
  }

  handleDownload(e) {
    e.preventDefault();
    e.stopPropagation();
    this.props.onDownload();
  }

  handleSelectFacet(facet, facetValue) {
    return function (e) {
      e.stopPropagation();
      this.props.onChange(facet, facetValue, e.target.checked);
    }.bind(this);
  }

  handleResetFilters(e) {
    e.preventDefault();
    e.stopPropagation();
    this.props.onReset();
  }

}

export default Facets;
