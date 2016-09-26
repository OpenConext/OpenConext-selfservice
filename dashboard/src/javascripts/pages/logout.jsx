import React from "react";
import I18n from "../lib/i18n";

class Logout extends React.Component {
  render() {
    return (
      <div className="mod-logout">
        {I18n.t("logout.title")}<br />
        <span dangerouslySetInnerHTML={{ __html: I18n.t("logout.description_html")}} />
      </div>
    );
  }
}

export default Logout;
