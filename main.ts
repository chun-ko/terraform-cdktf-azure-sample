import { Construct } from "constructs";
import { App, TerraformStack } from "cdktf";
import { AzurermProvider } from "@cdktf/provider-azurerm/lib/provider";
import { ResourceGroup } from "@cdktf/provider-azurerm/lib/resource-group";
import { VirtualNetwork } from "@cdktf/provider-azurerm/lib/virtual-network";
import { Subnet } from "@cdktf/provider-azurerm/lib/subnet";
import { NetworkInterface } from "@cdktf/provider-azurerm/lib/network-interface";
import { LinuxVirtualMachine } from "@cdktf/provider-azurerm/lib/linux-virtual-machine";

class MyStack extends TerraformStack {
  constructor(scope: Construct, name: string) {
    super(scope, name);

    new AzurermProvider(this, "provider", {
      features: {
        virtualMachine : {
          deleteOsDiskOnDeletion : true
        }
      }
    });

    let rg = new ResourceGroup(this, "rg-example", {
      name: "example-resource-group",
      location: "eastus"
    })
    let vnet = new VirtualNetwork(this, "vnet-example", {
      name: "example-network",
      location: rg.location,
      addressSpace: ["10.0.0.0/16"],
      resourceGroupName: rg.name
    })
    let subnet = new Subnet(this, "subnet-example", {
      name: "example-subnet",
      resourceGroupName: rg.name,
      virtualNetworkName: vnet.name,
      addressPrefixes: ["10.0.2.0/24"]
    })
    let network_interface = new NetworkInterface(this, "ni-example", {
      name: "example-nic",
      resourceGroupName: rg.name,
      location: rg.location,
      ipConfiguration: [{
        name: "internal",
        subnetId: subnet.id,
        privateIpAddressAllocation: "Dynamic"
      }]
    })
    new LinuxVirtualMachine(this, 'Web-Server', {
      name: "Web-App-1",
      resourceGroupName: rg.name,
      adminUsername: "redbelly",
      size: "Standard_DS1_v2",
      location: rg.location,
      networkInterfaceIds: [
        network_interface.id
      ],
      osDisk: {
        caching: "ReadWrite",
        storageAccountType: "Standard_LRS"
      },
      sourceImageReference: {
        publisher: "Canonical",
        offer: "0001-com-ubuntu-server-focal",
        sku: "20_04-lts-gen2",
        version: "latest"
      },
      adminSshKey: [{ username: "redbelly", publicKey: "ssh-rsa AAAAB3NzaC1yc2EAAAABJQAAAQEAlR+6cwU+0Wa0jWxLDV2fY4JYGVK9+hVCn13QclVgNkHyBidIZ0pJ/0AcOUa9mjm7mJPUb/orzA2g3CxMdweHjOTcTlGxbiuxdFgZHAmwV3v0CYKeyXbkJdqVYlw5E4sA2inJ7ivL7QTJOf2/sPcBZ3y4nhNETxnUSaxLPGOOJaD5gBFqJefcULK4M7XiQpmA18KJJha7j6MBm9Oe18sphS5JzR2lJ9RQ8bd7MtP/AVqxwkdMMlGM1uGD7UfKKKua7HZfcJJrKY0a6CVtljkJz4X+OkPjfAx1j/uUV1umXxDUMChgHztNVDan2+D8JX+c6im0WxM6jzbcPc4ooBUtvQ==" }]
    })
    // define resources here
  }
}

const app = new App();
new MyStack(app, "terraform-az");
app.synth();
