#!/bin/bash

ssh -t myvpn "./openvpn.sh; exec \$SHELL -l"