Object Specifications
=====================

This reference defines the expected format for several objects used within the architecture.

Users Object:

    {
        "pub": {
          "username": "dominic",
          "configurations": {
            "austin-1": {
              "name": "austin-1",
              "url": "dmi-austin.dmi.unibas.ch",
              "port": "22",
              "username": "user1"
              "workspace": "~/workspace",
              "workhome": "~/workhome"
            }
          },
          "socketID" : "[username]_[timestamp]",
          "console": "Welcome to the HPWC Workflow Manager!\n\n"
        },
        "password": "[SHA-3 hashed password]",
        "privateKey": "[privateKey]",
        "publicKey": "[publicKey]"
    }


Session Object:

    "pub": {
      [... user.pub: properties from Users Object above ...]
      "selectedConnection": {
        "name": "austin-1",
        "status": false,
        "project": {
          "name": "prova",
          "parameters": {
            "list":"a b c",
            "default":"10 10 10"
          },
          "threads":"4",
          "comment":"test22"
        }
      }
    }