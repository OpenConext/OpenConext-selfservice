package selfservice.api.dashboard;

import static java.lang.String.format;
import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.nullValue;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertThat;
import static org.junit.Assert.fail;
import static org.mockito.Matchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.setup.MockMvcBuilders.standaloneSetup;
import static selfservice.api.dashboard.Constants.HTTP_X_IDP_ENTITY_ID;
import static selfservice.api.dashboard.RestDataFixture.coinUser;
import static selfservice.api.dashboard.RestDataFixture.idp;

import java.util.Collections;
import java.util.Optional;

import com.google.common.collect.ImmutableList;
import com.google.common.collect.Sets;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.runners.MockitoJUnitRunner;
import org.springframework.http.MediaType;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.util.NestedServletException;

import selfservice.domain.CoinAuthority;
import selfservice.domain.CoinAuthority.Authority;
import selfservice.domain.CoinUser;
import selfservice.domain.IdentityProvider;
import selfservice.filter.EnsureAccessToIdpFilter;
import selfservice.filter.SpringSecurityUtil;
import selfservice.service.IdentityProviderService;
import selfservice.util.CookieThenAcceptHeaderLocaleResolver;

@RunWith(MockitoJUnitRunner.class)
public class UsersControllerTest {

  private static final String FOO_IDP_ENTITY_ID = "foo";
  private static final String BAR_IDP_ENTITY_ID = "bar";

  @InjectMocks
  private UsersController controller;

  @Mock
  private IdentityProviderService idpServiceMock;

  private MockMvc mockMvc;

  private CoinUser coinUser = coinUser("user", FOO_IDP_ENTITY_ID, BAR_IDP_ENTITY_ID);

  @Before
  public void setup() {
    controller.localeResolver = new CookieThenAcceptHeaderLocaleResolver();

    EnsureAccessToIdpFilter ensureAccessToIdp = new EnsureAccessToIdpFilter(idpServiceMock);

    mockMvc = standaloneSetup(controller)
      .setMessageConverters(new GsonHttpMessageConverter("", "", "", ""))
      .addFilter(ensureAccessToIdp, "/*")
      .build();

    SpringSecurityUtil.setAuthentication(coinUser);

    when(idpServiceMock.getIdentityProvider(anyString())).thenAnswer(answer -> Optional.of(idp((String) answer.getArguments()[0])));
    when(idpServiceMock.getAllIdentityProviders()).thenReturn(ImmutableList.of(idp(BAR_IDP_ENTITY_ID), idp(FOO_IDP_ENTITY_ID)));
  }

  @After
  public void after() {
    SecurityContextHolder.clearContext();
  }

  @Test
  public void returnsCurrentUser() throws Exception {
    mockMvc.perform(get(format("/dashboard/api/users/me"))
        .contentType(MediaType.APPLICATION_JSON).header(HTTP_X_IDP_ENTITY_ID, FOO_IDP_ENTITY_ID))
    .andExpect(status().isOk())
    .andExpect(jsonPath("$.payload.attributeMap['name-id']").value(coinUser.getUid()))
    .andExpect(jsonPath("$.payload.uid").value(coinUser.getUid()));
  }

  @Test
  public void returnsIdps() throws Exception {
    coinUser.setAuthorities(Collections.singleton(new CoinAuthority(Authority.ROLE_DASHBOARD_SUPER_USER)));

    mockMvc.perform(get(format("/dashboard/api/users/super/idps"))
        .contentType(MediaType.APPLICATION_JSON).header(HTTP_X_IDP_ENTITY_ID, FOO_IDP_ENTITY_ID))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.payload.idps").exists())
      .andExpect(jsonPath("$.payload.roles").exists());
  }

  @Test
  public void adminUserCantAccessIdps() throws Exception {
    coinUser.setAuthorities(Collections.singleton(new CoinAuthority(Authority.ROLE_DASHBOARD_ADMIN)));

    mockMvc.perform(get(format("/dashboard/api/users/super/idps"))
        .contentType(MediaType.APPLICATION_JSON).header(HTTP_X_IDP_ENTITY_ID, FOO_IDP_ENTITY_ID))
      .andExpect(status().isForbidden());
  }

  @Test
  public void thatIdpCanBeSwitchedToEmpty() throws Exception {
    coinUser.setAuthorities(Sets.newHashSet(new CoinAuthority(Authority.ROLE_DASHBOARD_SUPER_USER), new CoinAuthority(Authority.ROLE_DASHBOARD_ADMIN)));
    coinUser.setSwitchedToIdp(new IdentityProvider("idp-id", "idp-institution-id", "idp-name"));

    mockMvc.perform(get("/dashboard/api/users/me/switch-to-idp")
        .contentType(MediaType.APPLICATION_JSON).header(HTTP_X_IDP_ENTITY_ID, FOO_IDP_ENTITY_ID))
      .andExpect(status().isNoContent());

    assertThat(coinUser.getAuthorities(), contains(new CoinAuthority(Authority.ROLE_DASHBOARD_SUPER_USER)));
    assertThat(coinUser.getSwitchedToIdp(), nullValue());
  }

  @Test
  public void nonSuperUserCanSwitchIdpWithoutSpecifyingTheRole() throws Exception {
    coinUser.setAuthorities(Sets.newHashSet(new CoinAuthority(Authority.ROLE_DASHBOARD_ADMIN)));
    coinUser.setSwitchedToIdp(new IdentityProvider("idp-id", "idp-institution-id", "idp-name"));

    mockMvc.perform(get("/dashboard/api/users/me/switch-to-idp?idpId=" + BAR_IDP_ENTITY_ID)
        .contentType(MediaType.APPLICATION_JSON).header(HTTP_X_IDP_ENTITY_ID, FOO_IDP_ENTITY_ID))
      .andExpect(status().isNoContent());

    assertThat(coinUser.getAuthorities(), contains(new CoinAuthority(Authority.ROLE_DASHBOARD_ADMIN)));
    assertThat(coinUser.getSwitchedToIdp().getId(), is(BAR_IDP_ENTITY_ID));
  }

  @Test
  public void thatIdpCanBeSwitched() throws Exception {
    mockMvc.perform(get(format("/dashboard/api/users/me/switch-to-idp?idpId=%s&role=%s", BAR_IDP_ENTITY_ID, Authority.ROLE_DASHBOARD_ADMIN))
        .contentType(MediaType.APPLICATION_JSON).header(HTTP_X_IDP_ENTITY_ID, FOO_IDP_ENTITY_ID))
      .andExpect(status().isNoContent());
  }

  @Test
  public void cannotSwitchToIdpWithoutAccessToIt() throws Exception {
    try {
      mockMvc.perform(get(format("/dashboard/api/users/me/switch-to-idp?idpId=%s&role=%s", "no access", Authority.ROLE_DASHBOARD_ADMIN))
          .contentType(MediaType.APPLICATION_JSON).header(HTTP_X_IDP_ENTITY_ID, FOO_IDP_ENTITY_ID));
      fail("expected SecurityException");
    } catch (NestedServletException e) {
      assertEquals(SecurityException.class, e.getRootCause().getClass());
    }
  }
}
