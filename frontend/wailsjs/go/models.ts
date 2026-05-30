export namespace main {
	
	export class AppInfo {
	    name: string;
	    version: string;
	
	    static createFrom(source: any = {}) {
	        return new AppInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.version = source["version"];
	    }
	}
	export class ConnStatus {
	    state: string;
	    serverId?: string;
	    error?: string;
	
	    static createFrom(source: any = {}) {
	        return new ConnStatus(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.state = source["state"];
	        this.serverId = source["serverId"];
	        this.error = source["error"];
	    }
	}
	export class LogEntry {
	    level: string;
	    message: string;
	
	    static createFrom(source: any = {}) {
	        return new LogEntry(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.level = source["level"];
	        this.message = source["message"];
	    }
	}
	export class PingResult {
	    id: string;
	    ms: number;
	    ok: boolean;
	    err?: string;
	
	    static createFrom(source: any = {}) {
	        return new PingResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.ms = source["ms"];
	        this.ok = source["ok"];
	        this.err = source["err"];
	    }
	}

}

export namespace model {
	
	export class ProxySettings {
	    protocol: string;
	    bindScope: string;
	    port: number;
	    authEnabled: boolean;
	    username: string;
	    password: string;
	    setSystemProxy: boolean;
	
	    static createFrom(source: any = {}) {
	        return new ProxySettings(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.protocol = source["protocol"];
	        this.bindScope = source["bindScope"];
	        this.port = source["port"];
	        this.authEnabled = source["authEnabled"];
	        this.username = source["username"];
	        this.password = source["password"];
	        this.setSystemProxy = source["setSystemProxy"];
	    }
	}
	export class ServerProfile {
	    id: string;
	    name: string;
	    host: string;
	    port: number;
	    user: string;
	    authMethod: string;
	    secret?: string;
	    passphrase?: string;
	
	    static createFrom(source: any = {}) {
	        return new ServerProfile(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.host = source["host"];
	        this.port = source["port"];
	        this.user = source["user"];
	        this.authMethod = source["authMethod"];
	        this.secret = source["secret"];
	        this.passphrase = source["passphrase"];
	    }
	}
	export class TunSettings {
	    enabled: boolean;
	    mode: string;
	    cidrs: string[];
	    apps: string[];
	    domains: string[];
	    dnsProvider: string;
	    dnsCustom: string;
	
	    static createFrom(source: any = {}) {
	        return new TunSettings(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.enabled = source["enabled"];
	        this.mode = source["mode"];
	        this.cidrs = source["cidrs"];
	        this.apps = source["apps"];
	        this.domains = source["domains"];
	        this.dnsProvider = source["dnsProvider"];
	        this.dnsCustom = source["dnsCustom"];
	    }
	}

}

