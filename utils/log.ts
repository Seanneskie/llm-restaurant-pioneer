export function logInfo( obj: Record<string, unknown> ) {
    console.log( JSON.stringify( { level: "info", ...obj } ) );
}

export function logError(p0: string, obj: Record<string, unknown>) {
    console.log( JSON.stringify( { level: "error", ...obj } ) );
}