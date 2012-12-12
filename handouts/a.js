// M102 Fall 2012
// a.js 
// see also: a.sh

function ourinit() {
    // note: never use "localhost", or aliases for it, for production.  but for a 1 machine dev test it is ok.
    var x = rs.initiate(                                                                                    
        { _id:'z',                                                                                              
          members:[                                                                                             
    { _id:1, host:'localhost:27001' },                                                                   
    { _id:2, host:'localhost:27002' },                                                                   
    { _id:3, host:'localhost:27003' }                                                                    
    ]                                                                                                     
    });                                                                                                     
    printjson(x);                                                                                           
    print('waiting for set to come up');                                                                    
    while( 1 ) {                                                                                            
        sleep(2000);                                                                                          
        x = db.isMaster();                                                                                    
        printjson(x);                                                                                         
        if( x.ismaster || x.secondary ) {                                                                     
            // this means we are good, and set is in general in decent shape,                                   
            //  but doesn't mean everyone is ready yet.                                                         
            break;                                                                                              
        }                                                                                                     
    }                                                                                                       
}

p="priority";

function testRollback() {            
    if( !db.isMaster().ismaster ) {
        print("this member is not the primary.  run testRollback() on the 27003 and be sure it is primary.");
        printjson(db.isMaster());
        return;
    }
                                                                   
    // homework assumption: we are localhost:27003
    var a = connect("localhost:27001/admin");
    var b = connect("localhost:27002/admin");

    assert( db.isMaster().ismaster );
    assert( a.isMaster().secondary );
    assert( b.isMaster().secondary );

    db.foo.drop();
    print(1);
    db.getLastError(3); // await all to drop
    print(2);

    db.foo.insert({_id:1})
    db.foo.insert({_id:2})
    db.foo.insert({_id:3})

    print(3);
    printjson( db.getLastError('majority') );
    print(4);

    db.foo.insert({_id:4});
    b.shutdownServer();
    db.foo.insert({_id:5});
    print("wait 2");
    db.getLastError(2);
    print("got wait 2");
    db.foo.insert({_id:6});    
    a.shutdownServer();
    db.foo.insert({_id:7});
    db.foo.insert({_id:8});
    db.foo.insert({_id:9});
    db.getLastError();
    print("shutting down final mongod...");
    db.shutdownServer();
}                                                                                                       

function go()
{
  printjson( db.isMaster() );
  print();

  print("things to run for the homework:");
  print("  ourinit();");
  print("  testRollback()");
  print();
}

go();

function part4(){
    if( !db.isMaster().ismaster && !db.isMaster().secondary )
        throw "something is wrong the set isn't healthy";
    var z=db.getSisterDB("local").system.replset.find()[0].members;
    var n = 0;
    for( var i in z ) { 
        if( z[i][p] != 0 ) n++;
        if( z[i].slaveDelay ) n+=77;
    }
//    return rs.conf().members[2][p] || n;
    return ""+n+z.length+rs.status().members.length;
}

