/**
Javascript profiling module
This module is a part of Cryptojacking project to monitor the resource usage of the 
javascript code included into the website. 

The output is a trace file which can be viewd by DevTool Trace Viewer or parsed
by a customized json parsing script. 

The code basically extracts about: 
   1 - Runtime: exposing javascript runtime. 
   2 - Page: capturing events in the visited page.
   3 - Profiler: recording the behavior of javascript code included in a given page. 
*/
const Chrome = require('chrome-remote-interface');
const chrome_launcher = require('chrome-launcher');
const fs = require('fs');
const request = require('request');
const artifical_delay = n => new Promise(resolve => setTimeout(resolve, n));
const args = process.argv.slice(2);

//var TRACE_CATEGORIES = ["-*", "devtools.timeline", 
 //                       "devtools","content","content_capture","cc","cc.debug","dwrite",
  //                      "event","io","log","native","renderer_host","sync",
   //                     "disabled-by-default-devtools.timeline",
    //                    "disabled-by-default-devtools.timeline.frame", 
     //                   "toplevel", "blink.console", 
      //                  "disabled-by-default-devtools.timeline.stack",
       //                 "disabled-by-default-devtools.screenshot", 
        //                "disabled-by-default-v8.cpu_profile", 
         //               "disabled-by-default-v8.cpu_profiler", 
          //              "disabled-by-default-v8.cpu_profiler.hires",
           //             "FileSystem","file_system_provider"];

  var TRACE_CATEGORIES = [ "blink", "cc", "netlog","sequence_manager","toplevel","v8",
                            "user_action_samples","SYNCFileSystem"]
                    

var rawEvents = [];

const trace_path = 'PATH_1';
const static_script = 'PATH_2';
const dynamic_script = 'PATH_3';

const url = args.shift() || '';
console.log("visited: ", url);

if ( !url ) {
  process.stderr.write('No URL specified\n');
  process.exit(1);
}


inputs = `{${url}\n}`;
console.log(url);
fs.appendFileSync('./crawled_sites.txt', inputs);

Chrome(function(chrome){
  with(chrome) {
  const network_trace = generateFilename(url);
  Page.enable();
  Network.enable();
  Profiler.enable();
  Debugger.enable();

  const path = require('path');
 

  //console.log("this",process.cwd());
 // process.chdir('./Users/harunoz/Downloads/outguard-master/instrumentation');
  if (!fs.existsSync(static_script+network_trace)){
    fs.mkdirSync(static_script+network_trace, { recursive: true });
   // fs.mkdirSync(dynamic_script+network_trace, { recursive: true });
    fs.mkdirSync(trace_path+network_trace, { recursive: true }); }
    

  Debugger.scriptParsed((params) =>{
        Debugger.getScriptSource({
            scriptId: params.scriptId
        }, function(err, msg){
            if (err){ 
                message = `{${url}\t${msg}\n}`
               fs.appendFileSync('./error_file.txt', message);
              }
                              
             else{
               stringo = JSON.stringify(msg, null, 2);
               fs.writeFile(static_script+network_trace+ '/'+params.scriptId, stringo, (err)=>{
                    if (err) throw err;
                }
                )
                ;

                record = `${url}\t${params.url}\t${params.scriptId}\n`;
                var myString  = "test"
                console.log("my",myString)
                fs.appendFileSync(static_script+network_trace+'/'+myString, record);
        }}
       )
       
     });
  
  
  Network.requestWillBeSent((params) =>{

      request(params.request.url, function(error, response, body){
      let json = JSON.stringify(body);
      console.log("there",network_trace)
      var myString  = network_trace.slice(8);
      

    })

      event_trace = JSON.stringify(params, null, 2);
      console.log(network_trace)              
      var myString  = "test"

      fs.appendFileSync(trace_path+network_trace+"/"+ myString+'.reqtrace', event_trace);
      });

  Network.responseReceived((params) =>{

      event_trace = JSON.stringify(params, null, 2);
    //  console.log(network_trace)              
        var myString  = "test"
  //    console.log("my",myString)
   //   console.log(network_trace)
      fs.appendFileSync(trace_path+network_trace +"/"+myString +'.restrace', event_trace);
     });

  Tracing.start({
            "categories":   TRACE_CATEGORIES.join(','),
            "options":      "sampling-frequency=1000"  // 1000 is default and too slow.
        });
    Page.navigate({url});
    Page.navigatedWithinDocument({url})
    Page.fileChooserOpened=true;
    Page.interceptFileChooser=true;
    Browser.permissonSetting="granted";
    Browser.PermissionType = "accessibilityEvents";
  

    setTimeout(tt, 20000);
    
  function tt(){
           Tracing.end();
        }
  Tracing.tracingComplete(function () {     
            
            var myString  = "test"
            console.log("my",myString)
        //    console.log(rawEvents)
            fs.writeFileSync(trace_path+network_trace +"/"+myString + '.devtools.trace' , JSON.stringify(rawEvents, null, 2));
            console.log('Trace file: ' + trace_path+network_trace +"/"+myString + '.devtools.trace');
            chrome.close();
        });
  Tracing.dataCollected(function(data){
      var events = data.value;
   //   console.log(events)
      
      rawEvents = rawEvents.concat(events);
     });
 
  function generateFilename(address){
  const dummy_value = address.replace('http://', '');
  const fname = `${dummy_value}-${Date.now()}`;
  return fname
   }
   }

}).on('error', function(e){

  console.error('Cannot connect to Chrome');
});
