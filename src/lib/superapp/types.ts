export type ProviderRule={name:string;rateApi:boolean;capacityApi:boolean;active:boolean;effectiveFrom?:string;replacementProvider?:string;priority:number};
export type HotelAutomation={hotelId:string;hotelCode?:string;provider:string;hotelRate:boolean;hotelCapacity:boolean;rateExpert?:string;capacityExpert?:string;updatedAt?:string};
export type AutomationResult={score:number;status:string;rateSource:string;capacitySource:string;fullyOnline:boolean;migrationNeeded:boolean;suggestedProvider?:string;reason:string};
export type ImportSummary={total:number;inserted:number;updated:number;failed:number;errors:string[]};
