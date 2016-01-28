package selfservice.api.dashboard;

import java.util.List;

import javax.servlet.http.HttpServletRequest;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

import selfservice.domain.Category;
import selfservice.service.Csa;

@Controller
@RequestMapping("/dashboard/api/facets")
public class FacetsController extends BaseController {

  @Autowired
  private Csa csa;

  @RequestMapping(produces = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<RestResponse<List<Category>>> index(HttpServletRequest request) {
    List<Category> categories = csa.getTaxonomy().getCategories();
    return new ResponseEntity<>(createRestResponse(categories), HttpStatus.OK);
  }
}
