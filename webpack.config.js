var _ = require( 'lodash' );
var path = require( 'path' );
var webpack = require( 'webpack' );
var fs = require( 'fs' );

var nodeModules = _( fs.readdirSync( 'node_modules' ) )
    .filter( function ( x ) {
        return [ '.bin' ].indexOf( x ) === -1;
    } )
    .transform( function ( result, mod ) {
        result[ mod ] = 'commonjs ' + mod;
    }, {} )
    .value();

function pathTo() {
    return path.join( __dirname, 'src', path.join.apply( path, arguments ) );
}


module.exports = function( options ) {

    var config = {
        entry: options.entry,
        target: 'node',
        output: {
            path: options.outputPath,
            filename: 'api.js'
        },
        devtool: '#cheap-module-source-map',
        debug: true,
        externals: nodeModules,
        node: {
            __filename: true,
            __dirname: true
        },
        plugins: [
            new webpack.BannerPlugin( 'require("source-map-support").install();',
                { raw: true, entryOnly: false } )
        ],
        resolve: {
            extensions: [ '', '.js', '.jsx' ],
            alias: {
                //application aliases
                controllers: pathTo( 'controllers' ),
                exceptions: pathTo( 'exceptions' ),
                middleware: pathTo( 'middleware' ),
                models: pathTo( 'models' ),
                routes: pathTo( 'routes' ),
                services: pathTo( 'services' ),
                utils: pathTo( 'utils' ),

                db: pathTo( 'db' )
            }
        },
        module: {
            loaders: [
                {
                    test: /\.js$/,
                    loaders: [ 'babel' ],
                    exclude: path.join( __dirname, 'node_modules' )
                }
            ]
        }
    };

    _.each( options.aliases, function( path, alias ) {
        config.resolve.alias[ alias ] = pathTo( path );
    } );

    return config;
};