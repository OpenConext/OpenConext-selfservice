/*
 * Copyright 2012 SURFnet bv, The Netherlands
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package nl.surfnet.coin.selfservice.control;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.annotation.Resource;

import nl.surfnet.coin.selfservice.domain.CoinAuthority;
import nl.surfnet.coin.selfservice.domain.IdentityProvider;
import nl.surfnet.coin.selfservice.domain.Menu;
import nl.surfnet.coin.selfservice.domain.PersonAttributeLabel;
import nl.surfnet.coin.selfservice.domain.ServiceProvider;
import nl.surfnet.coin.selfservice.service.ServiceProviderService;
import nl.surfnet.coin.selfservice.service.impl.PersonAttributeLabelServiceJsonImpl;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.servlet.ModelAndView;

/**
 * Controller of the homepage showing 'my apps' (or my services, meaning the
 * services that belong to you as a user with a specific role)
 * 
 */
@Controller
public class HomeController extends BaseController {

  @Resource(name = "personAttributeLabelService")
  private PersonAttributeLabelServiceJsonImpl personAttributeLabelService;

  @Resource(name = "providerService")
  private ServiceProviderService providerService;

  @RequestMapping("/app-overview.shtml")
  public ModelAndView home(@ModelAttribute("currentrole") String currentRole,
      @ModelAttribute(value = "selectedidp") IdentityProvider selectedidp) {
    Map<String, Object> model = new HashMap<String, Object>();
    
    // TODO create a generic way of retrieving the services for the current role
    List<ServiceProvider> services;
    Menu menu;
    if (CoinAuthority.Authority.ROLE_IDP_SURFCONEXT_ADMIN.name().equals(currentRole)) {
      menu = buildMenu(MenuType.IDPADMIN, "home");
      services = providerService.getAllServiceProviders(selectedidp.getId());
    } else {
      menu = buildMenu(MenuType.USER, "home");
      services = providerService.getLinkedServiceProviders(selectedidp.getId());
    }
    model.put("menu", menu);
    model.put("sps", services);

    final Map<String, PersonAttributeLabel> attributeLabelMap = personAttributeLabelService.getAttributeLabelMap();
    model.put("personAttributeLabels", attributeLabelMap);

    return new ModelAndView("app-overview", model);
  }

  @RequestMapping("/styleguide.shtml")
  public ModelAndView styleguide() {
    Map<String, Object> model = new HashMap<String, Object>();
    model.put("menu", buildMenu(MenuType.USER, "styleguide"));
    return new ModelAndView("styleguide", model);
  }

  @RequestMapping("/form.shtml")
  public ModelAndView styleguideForm() {
    Map<String, Object> model = new HashMap<String, Object>();
    model.put("menu", buildMenu(MenuType.USER, "styleguide"));
    return new ModelAndView("styleguide-form", model);
  }

}
