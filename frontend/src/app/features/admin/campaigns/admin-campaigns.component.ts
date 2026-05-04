import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-campaigns',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-campaigns.component.html'
})
export class AdminCampaignsComponent implements OnInit {
  private adminService = inject(AdminService);
  campaigns: any[] = [];
  rewards: any[] = [];
  campaign: any = { name: '', description: '', bonusPoints: 100, startDate: '', endDate: '' };
  reward: any = { name: '', description: '', itemType: 'Coupon', pointsCost: 100, stock: -1 };
  activePanel: 'campaign' | 'reward' | null = null;
  message = '';
  error = '';

  ngOnInit() { this.load(); }
  load() {
    this.adminService.getCampaigns().subscribe(res => this.campaigns = res.data || []);
    this.adminService.getRewards().subscribe(res => this.rewards = res.data || []);
  }
  createCampaign() {
    this.message = '';
    this.error = '';
    this.adminService.createCampaign(this.campaign).subscribe({ next: () => { this.message = 'Campaign created.'; this.campaign = { name: '', description: '', bonusPoints: 100, startDate: '', endDate: '' }; this.activePanel = null; this.load(); }, error: err => this.error = err.error?.message || 'Failed to create campaign' });
  }
  createReward() {
    this.message = '';
    this.error = '';
    this.adminService.createReward(this.reward).subscribe({ next: () => { this.message = 'Reward created.'; this.reward = { name: '', description: '', itemType: 'Coupon', pointsCost: 100, stock: -1 }; this.activePanel = null; this.load(); }, error: err => this.error = err.error?.message || 'Failed to create reward' });
  }
  toggleCampaign(item: any) { this.adminService.setCampaignActive(item.campaignId, !item.isActive).subscribe(() => this.load()); }
  deleteCampaign(id: string) { if (confirm('Delete campaign?')) this.adminService.deleteCampaign(id).subscribe(() => this.load()); }
  toggleReward(item: any) { this.adminService.setRewardActive(item.itemId, !item.isActive).subscribe(() => this.load()); }
  deleteReward(id: string) { if (confirm('Delete reward?')) this.adminService.deleteReward(id).subscribe(() => this.load()); }
  activeCampaigns() { return this.campaigns.filter(item => item.isActive).length; }
  activeRewards() { return this.rewards.filter(item => item.isActive).length; }
}
