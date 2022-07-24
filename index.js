const core = require('@actions/core');
const exec = require('@actions/exec');
const fs = require("fs");
const path = require("path");


var workingDir = __dirname;

async function execSSH(cmd, desp = "") {
  core.info(desp);
  core.info("exec ssh: " + cmd);
  await exec.exec("bash " + workingDir + "/run.sh execSSH", [], { input: cmd });
}

async function execSSHSH(cmd, desp = "") {
  core.info(desp);
  core.info("exec ssh: " + cmd);
  await exec.exec("bash " + workingDir + "/run.sh execSSHSH", [], { input: cmd });
}

async function shell(cmd, cdToScriptHome = true) {
  core.info("exec shell: " + cmd);
  if(cdToScriptHome) {
    await exec.exec("bash", [], { input: "cd " + workingDir + " && (" + cmd + ")" });
  } else {
    await exec.exec("bash", [], { input:  cmd  });
  }


}


async function setup(nat, mem) {
  try {

    await shell("bash run.sh importVM");


    if (nat) {
      let nats = nat.split("\n").filter(x => x !== "");
      for (let element of nats) {
        core.info("Add nat: " + element);
        let segs = element.split(":");
        if (segs.length === 3) {
          //udp:"8081": "80"
          let proto = segs[0].trim().trim('"');
          let hostPort = segs[1].trim().trim('"');
          let vmPort = segs[2].trim().trim('"');

          await shell("bash run.sh addNAT " + proto + " " + hostPort + " " + vmPort);

        } else if (segs.length === 2) {
          let proto = "tcp"
          let hostPort = segs[0].trim().trim('"');
          let vmPort = segs[1].trim().trim('"');
          await shell("bash run.sh addNAT " + proto + " " + hostPort + " " + vmPort);
        }
      };
    }

    if (mem) {
      await shell("bash run.sh setMemory " + mem);
    }

    await shell("bash run.sh setCPU  3");

    await shell("bash run.sh startVM " );

    core.info("First boot");



    await shell("bash run.sh waitForLoginTag");


    let cmd1 = "mkdir -p /Users/runner/work && ln -s /Users/runner/work/  work";
    await execSSH(cmd1, "Setting up VM");

    let sync = core.getInput("sync");
    if (sync == "sshfs") {
      core.info("Setup sshfs");
      await shell("bash run.sh runSSHFSInVM");
    } else {
      await shell("bash run.sh installRsyncInVM");
      await shell("bash run.sh rsyncToVM");
    }

    core.info("OK, Ready!");

  }
  catch (error) {
    await shell("pwd && ls -lah" );
    await shell("bash -c 'pwd && ls -lah ~/.ssh/ && cat ~/.ssh/config'" );
    core.setFailed(error.message);
  }
}



async function main() {
  let debug = core.getInput("debug");
  process.env.DEBUG = debug;
  let release = core.getInput("release");
  core.info("release: " + release);
  if(release) {
    process.env.VM_RELEASE=release;
  }


  let nat = core.getInput("nat");
  core.info("nat: " + nat);

  let mem = core.getInput("mem");
  core.info("mem: " + mem);

  await setup(nat, mem);

  var envs = core.getInput("envs");
  console.log("envs:" + envs);

  if (envs) {
    fs.appendFileSync(path.join(process.env["HOME"], "/.ssh/config"), "SendEnv " + envs + "\n");
  }

  await shell("bash run.sh onStarted" );

  var prepare = core.getInput("prepare");
  if (prepare) {
    core.info("Running prepare: " + prepare);
    await execSSH(prepare);
  }

  var run = core.getInput("run");
  console.log("run: " + run);

  var error = null;
  try {
    var usesh = core.getInput("usesh").toLowerCase() == "true";
    if (usesh) {
      await execSSHSH("cd $GITHUB_WORKSPACE;\n" + run);
    } else {
      await execSSH("cd $GITHUB_WORKSPACE;\n" + run);
    }

  } catch (err) {
    error = err;
  } finally {
    let copyback = core.getInput("copyback");
    if(copyback !== "false") {
      let sync = core.getInput("sync");
      if (sync != "sshfs") {
        core.info("get back by rsync");
        await exec.exec("bash " + workingDir + "/run.sh rsyncBackFromVM");
      }
    }
    if(error) {
      core.setFailed(error.message);
      process.exit(1);
    } else {
      process.exit(0);
    }
  }
}



main().catch(ex => {
  core.setFailed(ex.message);
});
