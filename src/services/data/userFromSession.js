import _ from 'lodash';
import Promise from 'bluebird';

import { User } from 'models/users';

/**
 * Retrieves User from request.session.userId
 */

export default class {

    constructor( request ) {
        this.userId = _.get( request.session, 'userId' );

        this.user = null;
    }

    execute() {
        return new Promise( ( resolve, reject ) => {
            if ( this.userId ) {
                User
                    .forge( { id: this.userId } )
                    .fetch()
                    .then( resolve );
            } else {
                reject( new Error( 'not signed in' ) );
            }
        } );
    }
}