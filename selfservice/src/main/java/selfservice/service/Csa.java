package selfservice.service;

import java.util.List;
import java.util.Optional;

import selfservice.domain.Action;
import selfservice.domain.Service;
import selfservice.domain.Taxonomy;

public interface Csa {

  List<Service> getServicesForIdp(String idpEntityId);

  Taxonomy getTaxonomy();

  Optional<Service> getServiceForIdp(String idpEntityId, long serviceId);

  Action createAction(Action action);

}
