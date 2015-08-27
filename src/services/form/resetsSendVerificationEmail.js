import _ from 'lodash';
import nodemailer from 'nodemailer';
import smtpTransport from 'nodemailer-smtp-transport';
import Promise from 'bluebird';
import bcrypt from 'bcrypt';

import RecordNotFound from 'exceptions/recordNotFound';
import InvalidPostData from 'exceptions/invalidPostData';

import config from 'config';

import { User } from 'models/user';

export default class {

    constructor( payload ) {
        this.email = payload.email;

        this.user = null;
        this.verification = null;
    }

    execute() {
        return getUserFromDatabase.call( this )
            .bind( this )
            .then( checkIfIsLocal )
            .then( generateResetCodes )
            .then( sendVerificationEmail )
            .then( done );
    }
}

////////////////////
///// private

function getUserFromDatabase() {
    return User
        .forge( { email: this.email } )
        .fetch( {
            require: true,
            withRelated: [
                {
                    verifications: qb => [
                        qb.where( {
                            provider_name: 'local'
                        } )
                    ]
                }
            ]
        } )
        .then( u => this.user = u );
}

function checkIfIsLocal() {
    if ( !(this.email) ) {
        throw new InvalidPostData( 'The Email address id required' );
    }

    if ( this.user.related( 'verifications' ).size === 0 ) {
        throw new RecordNotFound( 'Not registered using username or password. Try social login instead.' );
    }
}

function generateResetCodes() {
    let verification = this.user
        .related( 'verifications' )
        .first();

    return verification
        .save( {
            reset_hash: resetHash.call( this ),
            reset_code: resetCode.call( this )
        }, { patch: true } )
        .then( v => this.verification = v );


    function resetHash() {
        let salt = bcrypt.genSaltSync();

        return bcrypt.hashSync( verification.get( 'hash' ), salt );
    }

    function resetCode() {
        return `${_.random( 1000, 9999 )}-${_.random( 1000, 9999 )}`;
    }
}

function sendVerificationEmail() {
    let sendMail;
    let transporter;

    transporter = nodemailer.createTransport( smtpTransport( {
        host: config.smtp.host,
        port: config.smtp.port,
        debug: config.smtp.debug,
        secure: false,
        ignoreTLS: true
    } ) );

    sendMail = Promise.promisify( transporter.sendMail, transporter );

    return sendMail( {
        from: 'noreply@soapee.com',
        to: this.email,
        subject: 'SOAPEE.COM - Password Reset',
        text: text.call( this )
    } );

    function text() {
        return `A password reset was requested for your http://soapee.com account.

        Enter the following code Reset Code to start your password reset process: ${ this.verification.get( 'reset_code' ) }

        It is safe to ignore this email if this password request was NOT generated by you.
        `;
    }
}

function done() {
    return {
        token: this.verification.get( 'reset_hash' )
    };
}
