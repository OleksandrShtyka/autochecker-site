import base from "./base.module.css";
import cabinet from "./cabinet.module.css";
import landing from "./landing.module.css";
import navigation from "./navigation.module.css";
import overlay from "./overlay.module.css";

const styles = {
  ...base,
  ...navigation,
  ...landing,
  ...overlay,
  ...cabinet,
};

export default styles;
