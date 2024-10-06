# Run GitHub CI in NetBSD ![Test](https://github.com/vmactions/netbsd-vm/workflows/Test/badge.svg)

Use this action to run your CI in NetBSD.

The github workflow only supports Ubuntu, Windows and MacOS. But what if you need to use NetBSD?




## 1. Example: `test.yml`:

```yml

name: Test

on: [push]

jobs:
  test:
    runs-on: ubuntu-latest
    name: A job to run test in NetBSD
    env:
      MYTOKEN : ${{ secrets.MYTOKEN }}
      MYTOKEN2: "value2"
    steps:
    - uses: actions/checkout@v4
    - name: Test in NetBSD
      id: test
      uses: vmactions/netbsd-vm@v1
      with:
        envs: 'MYTOKEN MYTOKEN2'
        usesh: true
        prepare: |
          /usr/sbin/pkg_add curl

        run: |
          pwd
          ls -lah
          whoami
          env
          /sbin/sysctl hw.model
          /sbin/sysctl hw.ncpu
          /sbin/sysctl hw.physmem
          /sbin/sysctl hw.usermem
          /usr/bin/vmstat





```


The latest major version is: `v1`, which is the most recommended to use. (You can also use the latest full version: `v1.1.3`)  


If you are migrating from the previous `v0`, please change the `runs-on: ` to `runs-on: ubuntu-latest`


The `envs: 'MYTOKEN MYTOKEN2'` is the env names that you want to pass into the vm.

The `run: xxxxx`  is the command you want to run in the vm.

The env variables are all copied into the VM, and the source code and directory are all synchronized into the VM.

The working dir for `run` in the VM is the same as in the Host machine.

All the source code tree in the Host machine are mounted into the VM.

All the `GITHUB_*` as well as `CI=true` env variables are passed into the VM.

So, you will have the same directory and same default env variables when you `run` the CI script.





## 2. Share code

The code is shared from the host to the VM via `rsync` by default, you can choose to use to `sshfs` share code instead.


```

...

    steps:
    - uses: actions/checkout@v4
    - name: Test
      id: test
      uses: vmactions/netbsd-vm@v1
      with:
        envs: 'MYTOKEN MYTOKEN2'
        usesh: true
        sync: sshfs
        prepare: |
          /usr/sbin/pkg_add curl



...


```

You can also set `sync: no`, so the files will not be synced to the  VM.


When using `rsync`,  you can define `copyback: false` to not copy files back from the VM in to the host.


```

...

    steps:
    - uses: actions/checkout@v4
    - name: Test
      id: test
      uses: vmactions/netbsd-vm@v1
      with:
        envs: 'MYTOKEN MYTOKEN2'
        usesh: true
        sync: rsync
        copyback: false
        prepare: |
          /usr/sbin/pkg_add curl



...


```


## 3. NAT from host runner to the VM

You can add NAT port between the host and the VM.

```
...
    steps:
    - uses: actions/checkout@v4
    - name: Test
      id: test
      uses: vmactions/netbsd-vm@v1
      with:
        envs: 'MYTOKEN MYTOKEN2'
        usesh: true
        nat: |
          "8080": "80"
          "8443": "443"
          udp:"8081": "80"
...
```


## 4. Set memory and cpu

The default memory of the VM is 6144MB, you can use `mem` option to set the memory size:

```
...
    steps:
    - uses: actions/checkout@v4
    - name: Test
      id: test
      uses: vmactions/netbsd-vm@v1
      with:
        envs: 'MYTOKEN MYTOKEN2'
        usesh: true
        mem: 4096
...
```


The VM is using all the cpu cores of the host by default, you can use `cpu` option to change the cpu cores:

```
...
    steps:
    - uses: actions/checkout@v4
    - name: Test
      id: test
      uses: vmactions/netbsd-vm@v1
      with:
        envs: 'MYTOKEN MYTOKEN2'
        usesh: true
        cpu: 3
...
```


## 5. Select release

It uses [the NetBSD 10.0](conf/default.release.conf) by default, you can use `release` option to use another version of NetBSD:

```
...
    steps:
    - uses: actions/checkout@v4
    - name: Test
      id: test
      uses: vmactions/netbsd-vm@v1
      with:
        release: "9.3"
...
```

All the supported releases are here: NetBSD  10.0, 9.0, 9.1, 9.2, 9.3, 9.4, test.releases [See all here](conf)



## 6. Custom shell

Support custom shell:

```
...
    steps:
    - uses: actions/checkout@v4
    - name: Test
      id: vm
      uses: vmactions/netbsd-vm@v1
    - name: Custom shell step 1
      shell: netbsd {0}
      run: |
        cd $GITHUB_WORKSPACE;
        pwd
        echo "this is step 1, running inside the VM"
    - name: Custom shell step 2
      shell: netbsd {0}
      run: |
        cd $GITHUB_WORKSPACE;
        pwd
        echo "this is step 2, running inside the VM"
...
```



# Under the hood

We use Qemu and Libvirt to run the NetBSD VM.




# Upcoming features:

1. Runs on MacOS to use cpu accelaration.
2. Support ARM and other architecture.




