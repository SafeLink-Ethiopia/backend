import { IService } from "../models/Service";

export const mockServices: IService[] = [
  {
    service_id: "SERVICE-001",
    name: "Addis Ababa Care Center",
    location: "Bole, Addis Ababa",
    contact: "+251-11-000-0000",
    service_type: "medical",
  } as IService,

  {
    service_id: "SERVICE-002",
    name: "Lideta Crisis Support Unit",
    location: "Lideta, Addis Ababa",
    contact: "+251-11-000-0001",
    service_type: "medical",
  } as IService,
];